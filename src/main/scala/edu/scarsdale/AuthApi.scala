/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
package edu.scarsdale

import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives.{as, complete, entity, path, post}
import akka.http.scaladsl.server.Route
import com.softwaremill.session.SessionDirectives
import com.softwaremill.session.{InMemoryRefreshTokenStorage, SessionConfig, SessionManager}
import com.softwaremill.session.SessionOptions.{refreshable, usingCookies}
import scala.util.{Failure, Success}

class AuthApi(implicit val system: ActorSystem[_]) {
  import system.executionContext

  val sessionConfig = SessionConfig.fromConfig()
  implicit val sessionManager = new SessionManager[Session](sessionConfig)
  implicit val refreshTokenStorage = new InMemoryRefreshTokenStorage[Session] {
    def log(msg: String): Unit = system.log.info(msg)
  }

  val session = SessionDirectives.session(refreshable, usingCookies)

  def logoutRoute(session: Session): Route = path("logout") {
    post {
      SessionDirectives.invalidateSession(refreshable, usingCookies) { context =>
        system.log.info("Logging out {}", session)
        context.complete("ok")
      }
    }
  }

  val loginRoute: Route = path("login") {
    post {
      entity(as[String]) { token =>
        GoogleIdentity.verify(token) match {
          case Some(user) =>
            Dao.upsertUser(user).onComplete {
              case Success(_) => system.log.info("Upsert user: {}", user)
              case Failure(ex) => system.log.error("Failed to upsert user {}/{}: {}", user.id, user.email, ex)
            }

            SessionDirectives.setSession(refreshable, usingCookies, Session(user.id)) {
              complete(StatusCodes.OK)
            }
          case None => complete(StatusCodes.Unauthorized)
        }
      }
    }
  }
}

/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
package edu.scarsdale

import akka.actor.CoordinatedShutdown
import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.softwaremill.session.SessionResult

import scala.concurrent.Await
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success}

// Scarsdale Schools Bulletin Board
//#main-class
object SSBB {
  //#start-http-server
  private def startHttpServer(routes: Route)(implicit system: ActorSystem[_]): Unit = {
    // Akka HTTP still needs a classic ActorSystem to start
    import system.executionContext

    val futureBinding = Http().newServerAt("0.0.0.0", 8080).bind(routes)
    futureBinding.onComplete {
      case Success(binding) =>
        val address = binding.localAddress
        system.log.info("Server online at http://{}:{}/", address.getHostString, address.getPort)
      case Failure(ex) =>
        system.log.error("Failed to bind HTTP endpoint, terminating system", ex)
        system.terminate()
    }
  }

  private def startAkka(): ActorSystem[Nothing] = {
    val rootBehavior = Behaviors.setup[Nothing] { context =>
      val system = context.system

      val authApi = new AuthApi()(system)
      val dataApi = new DataApi()(system)
      val routes = Route.seal {
        // Route.seal internally wraps its argument route with the handleExceptions
        // directive in order to catch and handle any exception.
        concat(
          pathPrefix("api") {
            authApi.session { result =>
              result match {
                case SessionResult.Decoded(session) => concat (
                  dataApi.routes(session),
                  authApi.logoutRoute(session)
                )
                case _ =>
                  system.log.info("Redirect on the session result: {}", result)
                  redirect("/signin.html", StatusCodes.TemporaryRedirect)
              }
            }
          },
          authApi.loginRoute,
          get {
            pathSingleSlash {
              redirect("/index.html", StatusCodes.PermanentRedirect)
            } ~ {
              path("index.html") {
                authApi.session { result =>
                  result match {
                    case SessionResult.Decoded(session) =>
                      getFromDirectory("./web")
                    case _ =>
                      system.log.info("Redirect on the session result: {}", result)
                      redirect("/signin.html", StatusCodes.TemporaryRedirect)
                  }
                }
              }
            } ~ {
              getFromDirectory("./web")
            }
          }
        )
      }

      startHttpServer(routes)(context.system)
      Behaviors.empty
    }

    ActorSystem[Nothing](rootBehavior, "ScarsdaleSchoolsAkkaHttpServer")
  }

  //#start-http-server
  def main(args: Array[String]): Unit = {
    //#server-bootstrapping
    implicit val ec = scala.concurrent.ExecutionContext.global
    if (!Dao.setup()) {
      return
    }

    if (args.length == 3) {
      val email = if (args(1).endsWith("@scarsdaleschools.org")) args(1) else (args(1) + "@scarsdaleschools.org")
      if (args(0) == "set") {
        val roleFuture = Dao.setRole(email, args(2))
        Await.ready(roleFuture, Duration.Inf)
        roleFuture.value match {
          case Some(result) => println(s"Set role for $email: $result")
          case None => ()
        }
      } else if (args(0) == "unset") {
        val roleFuture = Dao.deleteRole(email, args(2))
        Await.ready(roleFuture, Duration.Inf)
        roleFuture.value match {
          case Some(result) => println(s"Unset role for $email: $result")
          case None => ()
        }
      } else {
        println(s"Unknown command: ${args(0)}")
      }
    } else if (args.length == 2 && args(0) == "get") {
      val email = if (args(1).endsWith("@scarsdaleschools.org")) args(1) else (args(1) + "@scarsdaleschools.org")
      val roleFuture = Dao.getRoles(email)
      Await.ready(roleFuture, Duration.Inf)
      roleFuture.value match {
        case Some(result) => println(s"Get role for $email: $result")
        case None => ()
      }
    } else {
      val system = startAkka()
      CoordinatedShutdown(system).addJvmShutdownHook {
        Dao.db.close()
      }
    }
    //#server-bootstrapping
  }
}
//#main-class

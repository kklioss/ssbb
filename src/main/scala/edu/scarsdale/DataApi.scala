/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
package edu.scarsdale

import java.time.Instant
import akka.http.scaladsl.common.EntityStreamingSupport
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Route
import akka.actor.typed.ActorSystem
import akka.stream.scaladsl.Source

//#import-json-formats
//#data-routes-class
class DataApi()(implicit val system: ActorSystem[_]) {

  //#user-routes-class
  import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
  import JsonFormats._
  //#import-json-formats

  // If ask takes more time than this to complete the request is failed
  //private implicit val timeout = Timeout.create(system.settings.config.getDuration("ssbb.routes.ask-timeout"))
  // Source rendering support trait for HTTP response streaming
  private implicit val jsonStreamingSupport = EntityStreamingSupport.json()

  //#users-get-post-delete
  def userRoutes(session: Session): Route = {
    concat(
      path("roles" / Segment) { email =>
        get {
          onSuccess(Dao.getRoles(email)) { roles =>
            complete(RoleRespone(roles.distinct))
          }
        }
      },
      path("users") {
        get {
          complete(Source.fromPublisher(Dao.getUsers()))
        }
      },
      pathPrefix("user") {
        concat(
          pathEnd {
            post {
              entity(as[User]) { user =>
                onSuccess(Dao.insertUser(user)) { _ =>
                  complete(StatusCodes.Created)
                }
              }
            }
          },
          path("me") {
            get {
              rejectEmptyResponse {
                onSuccess(Dao.getUser(session.userId)) { maybeUser =>
                  complete(maybeUser)
                }
              }
            }
          },
          path(Segment) { id =>
            concat(
              get {
                rejectEmptyResponse {
                  onSuccess(Dao.getUser(id)) { maybeUser =>
                    complete(maybeUser)
                  }
                }
              },
              delete {
                onSuccess(Dao.deleteUser(id)) { _ =>
                  complete(StatusCodes.OK)
                }
              })
          })
      })
  }
  //#users-get-post-delete

  //#messages-get-post-delete
  def messageRoutes(session: Session): Route = {
    concat(
      path("messages" / LongNumber) { since =>
        parameters("category".?, "startDate".?, "endDate".?) { (category, startDate, endDate) =>
          get {
            complete(Source.fromPublisher(Dao.getMessages(Instant.ofEpochSecond(since), category, startDate, endDate)))
          }
        }
      },
      pathPrefix("message") {
        concat(
          pathEnd {
            post {
              entity(as[MessageRequest]) { r =>
                val message = Message(0, session.userId, r.title, r.body, r.category,
                  Instant.now(), Instant.now(), r.startTime, r.endTime)
                onSuccess(Dao.insertMessage(message)) { _ =>
                  complete(StatusCodes.Created)
                }
              }
            } ~
            put {
              entity(as[MessageRequest]) { r =>
                val message = Message(r.id, session.userId, r.title, r.body, r.category,
                  Instant.now(), Instant.now(), r.startTime, r.endTime)
                onSuccess(Dao.updateMessage(message, session.userId)) { _ =>
                  complete(StatusCodes.Created)
                }
              }
            }
          },
          path(LongNumber) { id =>
            concat(
              get {
                rejectEmptyResponse {
                  onSuccess(Dao.getMessage(id)) { maybeMessage =>
                    complete(maybeMessage)
                  }
                }
              },
              delete {
                onSuccess(Dao.deleteMessage(id)) { _ =>
                  complete(StatusCodes.OK)
                }
              })
          })
      })
  }
  //#messages-get-post-delete

  //#responses-get-post-delete
  def responseRoutes(session: Session): Route = {
    concat(
      path("responses" / LongNumber) { messageId =>
        get {
          complete(Source.fromPublisher(Dao.getResponses(messageId)))
        }
      },
      pathPrefix("response") {
        concat(
          pathEnd {
            post {
              entity(as[ResponseRequest]) { r =>
                val response = Response(0, session.userId, r.messageId, r.reply, Instant.now())
                onSuccess(Dao.insertResponse(response)) { _ =>
                  complete(StatusCodes.Created)
                }
              }
            }
          },
          path(LongNumber) { id =>
            concat(
              get {
                rejectEmptyResponse {
                  onSuccess(Dao.getResponse(id)) { maybeResponse =>
                    complete(maybeResponse)
                  }
                }
              },
              delete {
                onSuccess(Dao.deleteResponse(id)) { _ =>
                  complete(StatusCodes.OK)
                }
              })
          })
      })
  }
  //#responses-get-delete

  //#all-routes
  def routes(session: Session): Route =
    concat(
      userRoutes(session),
      messageRoutes(session),
      responseRoutes(session)
    )
  //#all-routes
}

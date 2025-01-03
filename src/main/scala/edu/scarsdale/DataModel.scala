package edu.scarsdale

import java.time.{Instant, LocalDate, ZoneId}
import com.typesafe.scalalogging.StrictLogging
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.util.Failure
import slick.basic.DatabasePublisher
import slick.jdbc.H2Profile.api._

final case class User(id: String,
                      name: String,
                      givenName: String,
                      familyName: String,
                      locale: Option[String],
                      pictureUrl: String,
                      email: String,
                      lastLogin: Instant)

final case class Role(id: Long,
                      email: String,
                      tag: String)

final case class RoleRespone(roles: Seq[String])

final case class Message(id: Long,
                         createdBy: String,
                         title: String,
                         body: String,
                         category: String,
                         createdAt: Instant,
                         updatedAt: Instant,
                         startTime: Option[Instant] = None,
                         endTime: Option[Instant] = None,
                         revoked: Boolean = false)

final case class MessageRequest(id: Long,
                         title: String,
                         body: String,
                         category: String,
                         startTime: Option[Instant] = None,
                         endTime: Option[Instant] = None)

final case class Response(id: Long,
                          userId: String,
                          messageId: Long,
                          reply: String,
                          createdAt: Instant,
                          revoked: Boolean = false)

final case class ResponseRequest(messageId: Long, reply: String)

object Schema {
  // Definition of the USERS table
  class Users(tag: Tag) extends Table[User](tag, "USERS") {
    def id = column[String]("USER_ID", O.PrimaryKey) // This is the primary key column

    def name = column[String]("NAME")

    def givenName = column[String]("GIVEN_NAME")

    def familyName = column[String]("FAMILY_NAME")

    def locale = column[Option[String]]("LOCALE")

    def pictureUrl = column[String]("PICTURE_URL")

    def email = column[String]("EMAIL")

    def lastLogin = column[Instant]("LAST_LOGIN")

    // Every table needs a * projection with the same type as the table's type parameter
    def * = (id, name, givenName, familyName, locale, pictureUrl, email, lastLogin) <> (User.tupled, User.unapply)
  }
  val users = TableQuery[Users]

  // Definition of the ROLES table
  class Roles(ctag: Tag) extends Table[Role](ctag, "ROLES") {
    def id = column[Long]("ROLE_ID", O.PrimaryKey, O.AutoInc)

    def email = column[String]("EMAIL")

    def tag = column[String]("TAG")

    def * = (id, email, tag) <> (Role.tupled, Role.unapply)
  }
  val roles = TableQuery[Roles]

  // Definition of the MESSAGES table
  class Messages(tag: Tag) extends Table[Message](tag, "MESSAGES") {
    def id = column[Long]("MESSAGE_ID", O.PrimaryKey, O.AutoInc)

    def createdBy = column[String]("CREATED_BY")

    def title = column[String]("TITLE")

    def body = column[String]("BODY")

    // news, debate, sports, ...
    def category = column[String]("CATEGORY")

    def createdAt = column[Instant]("CREATED_AT")

    def updatedAt = column[Instant]("UPDATED_AT")

    def startTime = column[Option[Instant]]("START_TIME")

    def endTime = column[Option[Instant]]("END_TIME")

    def revoked = column[Boolean]("REVOKED")

    def * = (id, createdBy, title, body, category, createdAt, updatedAt, startTime, endTime, revoked) <> (Message.tupled, Message.unapply)

    // A reified foreign key relation that can be navigated to create a join
    def user = foreignKey("USER_FK", createdBy, users)(_.id)
  }
  val messages = TableQuery[Messages]


  // Definition of the RESPONSES table
  class Responses(tag: Tag) extends Table[Response](tag, "RESPONSES") {
    def id = column[Long]("RESPONSE_ID", O.PrimaryKey, O.AutoInc)

    def userId = column[String]("USER_ID")

    def messageId = column[Long]("MESSAGE_ID")

    // like, dislike, attend, ...
    def reply = column[String]("REPLY")

    def createdAt = column[Instant]("CREATED_AT")

    def revoked = column[Boolean]("REVOKED")

    def * = (id, userId, messageId, reply, createdAt, revoked) <> (Response.tupled, Response.unapply)

    // A reified foreign key relation that can be navigated to create a join
    def user = foreignKey("USER_FK", userId, users)(_.id)
    def message = foreignKey("MESSAGE_FK", messageId, messages)(_.id)
  }
  val responses = TableQuery[Responses]
}

// Data access object
object Dao extends StrictLogging {
  import edu.scarsdale.Schema.{messages, responses, roles, users}

  val db = Database.forConfig("ssbb.db")

  //#setup database
  def setup()(implicit ec: ExecutionContext): Boolean = {
    val setup = DBIO.seq(
      // Create the tables, including primary and foreign keys
      (users.schema ++ messages.schema ++ responses.schema ++ roles.schema).createIfNotExists
    )

    val setupFuture = db.run(setup)
    Await.ready(setupFuture, Duration.Inf).value match {
      case Some(Failure(ex)) =>
        logger.error("Failed to setup database: {}", ex)
        false
      case _ => true
    }
  }

  def getUsers(limit: Int = 100): DatabasePublisher[User] = {
    db.stream(users.take(limit).result)
  }

  def getUser(id: String): Future[Option[User]] = {
    db.run(users.filter(_.id === id).result.headOption)
  }

  def insertUser(user: User): Future[Int] = {
    db.run(users += user)
  }

  def upsertUser(user: User): Future[Int] = {
    db.run(users.insertOrUpdate(user))
  }

  def deleteUser(id: String): Future[Int] = {
    db.run(users.filter(_.id === id).delete)
  }

  def getRoles(email: String): Future[Seq[String]] = {
    db.run(roles.filter(_.email === email).map(_.tag).result)
  }

  def setRole(email: String, tag: String): Future[Int] = {
    val role = Role(0, email, tag)
    db.run(roles += role)
  }

  def deleteRole(email: String, tag: String): Future[Int] = {
    val q = roles.filter(r => r.email === email && r.tag === tag)
    db.run(q.delete)
  }

  def getMessages(before: Instant, category: Option[String],
                  startDate: Option[String], endDate: Option[String], limit: Int = 100): DatabasePublisher[Message] = {
    var q = messages.filter(m => m.updatedAt < before && m.revoked === false)

    if (category.isDefined) {
      q = q.filter(m => m.category === category.get)
    }
    if (startDate.isDefined) {
      val date = LocalDate.parse(startDate.get)
      val instant = date.atStartOfDay(ZoneId.systemDefault).toInstant
      q = q.filter(m => m.startTime >= instant)
    }
    if (endDate.isDefined) {
      val date = LocalDate.parse(endDate.get)
      val instant = date.atStartOfDay(ZoneId.systemDefault).toInstant
      q = q.filter(m => m.startTime <= instant)
    }

    db.stream(
      q.sortBy(_.updatedAt.desc)
        .take(limit)
        .result
    )
  }

  def getMessage(id: Long): Future[Option[Message]] = {
    db.run(messages.filter(_.id === id).result.headOption)
  }

  def insertMessage(message: Message): Future[Int] = {
    db.run(messages += message)
  }

  def updateMessage(message: Message, userId: String): Future[Int] = {
    val q = messages.filter(m => m.id === message.id && m.createdBy === userId)
      .map(m => (m.title, m.body, m.category, m.updatedAt, m.startTime, m.endTime))
    db.run(q.update((message.title, message.body, message.category, Instant.now, message.startTime, message.endTime)))
  }

  def deleteMessage(id: Long): Future[Int] = {
    val q = messages.filter(m =>m.id === id).map(_.revoked)
    db.run(q.update(true))
  }

  def getResponses(messageId: Long): DatabasePublisher[Response] = {
    db.stream(
      responses.filter(r => r.messageId === messageId && r.revoked === false)
        .sortBy(_.createdAt.desc)
        .result
    )
  }

  def getResponses(before: Instant, limit: Int = 100): DatabasePublisher[Response] = {
    db.stream(
      responses.filter(r => r.createdAt < before && r.revoked === false)
        .sortBy(_.createdAt.desc)
        .take(limit)
        .result
    )
  }

  def getResponse(responseId: Long): Future[Option[Response]] = {
    db.run(responses.filter(_.id === responseId).result.headOption)
  }

  def insertResponse(response: Response): Future[Int] = {
    db.run(responses += response)
  }

  def deleteResponse(id: Long): Future[Int] = {
    val q = responses.filter(r => r.id === id).map(_.revoked)
    db.run(q.update(true))
  }
}
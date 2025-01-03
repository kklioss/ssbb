package edu.scarsdale

import com.softwaremill.session.{SessionSerializer, SingleValueSessionSerializer}
import scala.util.Try

case class Session(userId: String)

object Session {
  implicit def serializer: SessionSerializer[Session, String] =
    new SingleValueSessionSerializer(_.userId, (id: String) => Try { Session(id) })
}
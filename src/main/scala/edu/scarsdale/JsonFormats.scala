/*
 * Copyright (c) 2021 Karl Li. All rights reserved.
 */
package edu.scarsdale

import java.time.Instant
//#json-formats
import spray.json.{DefaultJsonProtocol, JsString, JsValue, JsonFormat}

object JsonFormats  {
  // import the default encoders for primitive types (Int, String, Lists etc)
  import DefaultJsonProtocol._

  implicit val instantJsonFormat: JsonFormat[Instant] = new JsonFormat[Instant] {
    override def write(ts: Instant): JsValue = JsString(ts.toString)

    override def read(json: JsValue): Instant = json match {
      case JsString(x) => Instant.parse(x)
      case _ => throw new IllegalArgumentException(s"Can not parse json value [$json] to an Instant object")
    }
  }

  implicit val userJsonFormat = jsonFormat8(User)
  implicit val roleJsonFormat = jsonFormat1(RoleRespone)
  implicit val messageJsonFormat = jsonFormat10(Message)
  implicit val responseJsonFormat = jsonFormat6(Response)
  implicit val messageRequestJsonFormat = jsonFormat6(MessageRequest)
  implicit val responseRequestJsonFormat = jsonFormat2(ResponseRequest)
}
//#json-formats

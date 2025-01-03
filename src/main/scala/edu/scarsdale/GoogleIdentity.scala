package edu.scarsdale

import java.time.Instant
import java.util.Collections
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import akka.http.scaladsl.server.directives.Credentials
import com.typesafe.scalalogging.StrictLogging
import scala.concurrent.Future

object GoogleIdentity extends StrictLogging {

  val verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
    .setAudience(Collections.singletonList("1001543911144-64realdglo2q7knfrga7j52f1kcjp99h.apps.googleusercontent.com"))
    .build()

  def verify(idToken: String): Option[User] = {
    logger.info("Verify Google id token: {}", idToken)

    Option(verifier.verify(idToken)).map(_.getPayload)
      .filter { payload =>
        val acceptable = payload.getEmailVerified && "scarsdaleschools.org" == payload.getHostedDomain()
        if (!acceptable) {
          logger.info("Unacceptable Google id: {}", payload)
        }
        acceptable
      }.map { payload =>
        val userId = payload.getSubject
        // Get profile information from payload
        val email = payload.getEmail
        val name = payload.get("name").asInstanceOf[String]
        val pictureUrl = payload.get("picture").asInstanceOf[String]
        val locale = Option(payload.get("locale").asInstanceOf[String])
        val familyName = payload.get("family_name").asInstanceOf[String]
        val givenName = payload.get("given_name").asInstanceOf[String]
        User(userId, name, givenName, familyName, locale, pictureUrl, email, Instant.now())
      }
  }

  def authenticator(credentials: Credentials): Future[Option[User]] =
    credentials match {
      case _ @ Credentials.Provided(token) => Future.successful(verify(token))
      case _ => Future.successful(None)
    }
}

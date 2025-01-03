Compile / mainClass := Some("edu.scarsdale.SSBB")

// native packager
enablePlugins(JavaServerAppPackaging)
maintainer := "Karl Li <kli23@scarsdaleschools.org>"
packageName := "ssbb"
packageSummary := "Scarsdale Schools Bulletin Board"

lazy val akkaHttpVersion = "10.2.9"
lazy val akkaVersion    = "2.6.19"

// Run in a separate JVM, to make sure sbt waits until all threads have
// finished before returning.
// If you want to keep the application running while executing other
// sbt tasks, consider https://github.com/spray/sbt-revolver/
fork := true

lazy val root = (project in file(".")).
  settings(
    inThisBuild(List(
      organization    := "edu.scarsdale",
      scalaVersion    := "2.13.8"
    )),
    name := "ssbb",
    libraryDependencies ++= Seq(
      "com.typesafe.akka"  %% "akka-http"                % akkaHttpVersion,
      "com.typesafe.akka"  %% "akka-http-spray-json"     % akkaHttpVersion,
      "com.typesafe.akka"  %% "akka-actor-typed"         % akkaVersion,
      "com.typesafe.akka"  %% "akka-stream"              % akkaVersion,
      "com.typesafe.slick" %% "slick"                    % "3.3.3",
      "com.typesafe.scala-logging" %% "scala-logging"    % "3.9.4",
      "com.softwaremill.akka-http-session" %% "core"     % "0.7.0",

      "com.h2database"        % "h2"                     % "2.1.212",
      "ch.qos.logback"        % "logback-classic"        % "1.2.3",
      "com.google.api-client" % "google-api-client"      % "1.32.1",

      "com.typesafe.akka"  %% "akka-http-testkit"        % akkaHttpVersion % Test,
      "com.typesafe.akka"  %% "akka-actor-testkit-typed" % akkaVersion     % Test,
      "org.scalatest"      %% "scalatest"                % "3.1.4"         % Test
    )
  )

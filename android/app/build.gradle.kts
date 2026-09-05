import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val releaseProperties = Properties()
val releasePropertiesFile = rootProject.file("key.properties")
if (releasePropertiesFile.exists()) {
    releasePropertiesFile.inputStream().use(releaseProperties::load)
}

android {
    namespace = "com.smithheffa.paygate"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.smithheffa.paygate"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // Production signing is supplied only by the existing CI secret group.
            if (releasePropertiesFile.exists()) {
                signingConfig = signingConfigs.create("release") {
                    storeFile = releaseProperties["storeFile"]?.let(::file)
                    storePassword = releaseProperties["storePassword"] as String?
                    keyAlias = releaseProperties["keyAlias"] as String?
                    keyPassword = releaseProperties["keyPassword"] as String?
                }
            }
        }
    }
}

flutter {
    source = "../.."
}

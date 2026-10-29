plugins {
    id("com.android.application")
}

android {
    namespace = "com.wageticker.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wageticker.app"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

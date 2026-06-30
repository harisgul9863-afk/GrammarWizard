import { androidProjectFiles } from "../src/androidCodebase";
import * as fs from "fs";
import * as path from "path";

function ensureDir(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function writeProjectFile(relativeFilePath: string, content: string) {
  const fullPath = path.resolve(process.cwd(), relativeFilePath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), "utf8");
  console.log(`Successfully wrote: ${relativeFilePath}`);
}

async function run() {
  console.log("Starting Android Codebase extraction...");

  // 1. Write simulated android code files from our database/assets array
  for (const file of androidProjectFiles) {
    writeProjectFile(file.path, file.content);
  }

  // 2. Write top-level settings.gradle.kts
  const settingsGradle = `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "GrammarWizard"
include(":app")
`;
  writeProjectFile("settings.gradle.kts", settingsGradle);

  // 3. Write top-level build.gradle.kts
  const topBuildGradle = `
// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
`;
  writeProjectFile("build.gradle.kts", topBuildGradle);

  // 4. Write gradle.properties
  const gradleProperties = `
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`;
  writeProjectFile("gradle.properties", gradleProperties);

  // 5. Write missing Android resources (Strings, Themes, XML backups, Icon assets)
  // This guarantees the gradle compiler doesn't throw a "resource not found" error during gradle build.
  
  // A. strings.xml
  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Grammar Wizard</string>
</resources>
`;
  writeProjectFile("app/src/main/res/values/strings.xml", stringsXml);

  // B. themes.xml
  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme. -->
    <style name="Theme.GrammarWizard" parent="android:Theme.Material.Light.NoActionBar">
        <!-- Customize your theme here. -->
    </style>
</resources>
`;
  writeProjectFile("app/src/main/res/values/themes.xml", themesXml);

  // C. colors.xml
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="white">#FFFFFFFF</color>
    <color name="black">#FF000000</color>
</resources>
`;
  writeProjectFile("app/src/main/res/values/colors.xml", colorsXml);

  // D. data_extraction_rules.xml & backup_rules.xml (referenced in AndroidManifest.xml)
  const backupRulesXml = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content />
`;
  const dataExtractionRulesXml = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup />
    <device-transfer />
</data-extraction-rules>
`;
  writeProjectFile("app/src/main/res/xml/backup_rules.xml", backupRulesXml);
  writeProjectFile("app/src/main/res/xml/data_extraction_rules.xml", dataExtractionRulesXml);

  // E. Launcher Icons (as Adaptive Vector Drawables, which is lightweight and parses correctly)
  const icLauncherForeground = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FF6200EE"
        android:pathData="M54,24 L84,74 L24,74 Z" />
</vector>
`;
  const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/white"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`;

  writeProjectFile("app/src/main/res/drawable/ic_launcher_foreground.xml", icLauncherForeground);
  writeProjectFile("app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml", icLauncherXml);
  writeProjectFile("app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml", icLauncherXml);

  // 6. Write Version Catalog gradle/libs.versions.toml
  const libsVersionsToml = `
[versions]
agp = "8.2.2"
kotlin = "1.9.22"
coreKtx = "1.12.0"
junit = "4.13.2"
junitVersion = "1.1.5"
espressoCore = "3.5.1"
lifecycleRuntimeKtx = "2.7.0"
activityCompose = "1.8.2"
composeBom = "2023.10.01"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-livedata-ktx = { group = "androidx.lifecycle", name = "lifecycle-livedata-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
`;
  writeProjectFile("gradle/libs.versions.toml", libsVersionsToml);

  console.log("Extraction completed! Your repository is now fully structured for direct gradle compilation!");
}

run().catch((err) => {
  console.error("Extraction failed:", err);
  process.exit(1);
});

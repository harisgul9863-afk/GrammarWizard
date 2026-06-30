import { AndroidFile } from "./types";

export const androidProjectFiles: AndroidFile[] = [
  {
    name: "build.gradle.kts (App)",
    path: "app/build.gradle.kts",
    language: "gradle",
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.grammarwizard.mcq"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.grammarwizard.mcq"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Android Core & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.livedata.ktx)

    // Jetpack Compose UI
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    
    // Security: EncryptedSharedPreferences
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Networking: Retrofit & OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Concurrency: Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}`
  },
  {
    name: "AndroidManifest.xml",
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Web requests are required to fetch the quiz from Gemini API -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.GrammarWizard"
        tools:targetApi="34">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.GrammarWizard"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
  },
  {
    name: "EncryptedPrefs.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/EncryptedPrefs.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * Provides secure storage wrapper using Android's EncryptedSharedPreferences.
 * Keeps the Gemini API Key highly protected.
 */
class EncryptedPrefs(context: Context) {

    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    
    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        "grammar_wizard_secure_prefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_GEMINI_API = "gemini_api_key"
    }

    fun saveApiKey(apiKey: String) {
        sharedPreferences.edit().putString(KEY_GEMINI_API, apiKey).apply()
    }

    fun getApiKey(): String? {
        return sharedPreferences.getString(KEY_GEMINI_API, null)
    }

    fun clearApiKey() {
        sharedPreferences.edit().remove(KEY_GEMINI_API).apply()
    }

    fun hasApiKey(): Boolean {
        return !getApiKey().isNullOrBlank()
    }
}`
  },
  {
    name: "QuizModels.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/data/QuizModels.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.data

import com.google.gson.annotations.SerializedName

/**
 * Data representation of a parsed English Grammar Question.
 */
data class QuizQuestion(
    @SerializedName("question") val question: String,
    @SerializedName("options") val options: List<String>,
    @SerializedName("correct_answer") val correctAnswer: Int
)

/**
 * API Request payload structure for Google Gemini API
 */
data class GeminiRequest(
    @SerializedName("contents") val contents: List<Content>,
    @SerializedName("systemInstruction") val systemInstruction: SystemInstruction? = null,
    @SerializedName("generationConfig") val generationConfig: GenerationConfig? = null
)

data class Content(
    @SerializedName("parts") val parts: List<Part>
)

data class Part(
    @SerializedName("text") val text: String
)

data class SystemInstruction(
    @SerializedName("parts") val parts: List<Part>
)

data class GenerationConfig(
    @SerializedName("responseMimeType") val responseMimeType: String = "application/json",
    @SerializedName("responseSchema") val responseSchema: Any? = null
)

/**
 * API Response payload structure for Google Gemini API
 */
data class GeminiResponse(
    @SerializedName("candidates") val candidates: List<Candidate>?
)

data class Candidate(
    @SerializedName("content") val content: Content?
)`
  },
  {
    name: "GeminiApiService.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/api/GeminiApiService.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.api

import com.grammarwizard.mcq.data.GeminiRequest
import com.grammarwizard.mcq.data.GeminiResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface GeminiApiService {

    @POST("v1beta/models/gemini-1.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): GeminiResponse

    companion object {
        private const val BASE_URL = "https://generativelanguage.googleapis.com/"

        fun create(): GeminiApiService {
            val logger = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(logger)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(GeminiApiService::class.java)
        }
    }
}`
  },
  {
    name: "QuizViewModel.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/viewmodel/QuizViewModel.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.viewmodel

import android.app.Application
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.grammarwizard.mcq.EncryptedPrefs
import com.grammarwizard.mcq.api.GeminiApiService
import com.grammarwizard.mcq.data.Content
import com.grammarwizard.mcq.data.GeminiRequest
import com.grammarwizard.mcq.data.Part
import com.grammarwizard.mcq.data.QuizQuestion
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ScreenState {
    object SetupKey : ScreenState()
    object QuizInput : ScreenState()
    object Loading : ScreenState()
    object ActiveQuiz : ScreenState()
    object QuizResults : ScreenState()
}

/**
 * QuizViewModel coordinates secure API storage, state preservation,
 * and background thread calls using Android ViewModel & Coroutines.
 */
class QuizViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = EncryptedPrefs(application)
    private val apiService = GeminiApiService.create()

    // Key preservation
    val savedKey = MutableStateFlow(prefs.getApiKey() ?: "")

    // UI screen flow state
    private val _screenState = MutableStateFlow<ScreenState>(
        if (prefs.hasApiKey()) ScreenState.QuizInput else ScreenState.SetupKey
    )
    val screenState: StateFlow<ScreenState> = _screenState.asStateFlow()

    // Generated Quiz Items
    private val _quizQuestions = MutableStateFlow<List<QuizQuestion>>(emptyList())
    val quizQuestions: StateFlow<List<QuizQuestion>> = _quizQuestions.asStateFlow()

    // User Response State (Compose-friendly surviving reconfiguration/rotation)
    val userAnswers = mutableStateMapOf<Int, Int>() // questionIndex -> selectedIndex
    val currentQuestionIndex = mutableStateOf(0)
    val score = mutableStateOf(0)

    // Async State Status
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun saveApiKey(key: String) {
        if (key.isNotBlank()) {
            prefs.saveApiKey(key)
            savedKey.value = key
            _screenState.value = ScreenState.QuizInput
        }
    }

    fun clearSavedKey() {
        prefs.clearApiKey()
        savedKey.value = ""
        _screenState.value = ScreenState.SetupKey
    }

    fun buildQuiz(notesText: String) {
        viewModelScope.launch {
            _screenState.value = ScreenState.Loading
            _errorMessage.value = null
            
            // Clear current states
            userAnswers.clear()
            currentQuestionIndex.value = 0
            score.value = 0

            try {
                val promptText = "Analyze the provided text. Generate a 10-question English Grammar MCQ quiz based solely on the active rules (such as tense formation, auxiliary verbs, or sentence structure) found in the text. Ensure each question has exactly 4 options and 1 unambiguous correct answer. Return the result strictly in this JSON format: [ { \\"question\\": \\"...\\", \\"options\\": [\\"A\\",\\"B\\",\\"C\\",\\"D\\"], \\"correct_answer\\": 0 } ]"
                val textPayload = "$promptText\\n\\nText:\\n$notesText"

                val request = GeminiRequest(
                    contents = listOf(
                        Content(parts = listOf(Part(text = textPayload)))
                    )
                )

                val response = apiService.generateContent(savedKey.value, request)
                val rawJson = response.candidates?.getOrNull(0)?.content?.parts?.getOrNull(0)?.text

                if (rawJson == null) {
                    _errorMessage.value = "Unable to process the grammar text. Please ensure your API key is correct."
                    _screenState.value = ScreenState.QuizInput
                    return@launch
                }

                // Parse generated content using GSON library
                val cleanJson = cleanJsonResponse(rawJson)
                val listType = object : TypeToken<List<QuizQuestion>>() {}.type
                val questions: List<QuizQuestion> = Gson().fromJson(cleanJson, listType)

                if (questions.size == 10) {
                    _quizQuestions.value = questions
                    _screenState.value = ScreenState.ActiveQuiz
                } else {
                    _errorMessage.value = "Failed to parse exactly 10 high-quality questions. Please try again with more descriptive notes."
                    _screenState.value = ScreenState.QuizInput
                }

            } catch (e: Exception) {
                _errorMessage.value = "Network Error: \${e.localizedMessage ?: "Please check internet connection or API Key."}"
                _screenState.value = ScreenState.QuizInput
            }
        }
    }

    fun submitQuiz() {
        var correctCount = 0
        _quizQuestions.value.forEachIndexed { index, question ->
            val userSel = userAnswers[index]
            if (userSel != null && userSel == question.correctAnswer) {
                correctCount++
            }
        }
        score.value = correctCount
        _screenState.value = ScreenState.QuizResults
    }

    fun navigateToInput() {
        _screenState.value = ScreenState.QuizInput
        _errorMessage.value = null
    }

    private fun cleanJsonResponse(raw: String): String {
        // Stripe markdown code blocks if the AI model returned them
        var result = raw.trim()
        if (result.startsWith("\`\`\`json")) {
            result = result.substring(7)
        } else if (result.startsWith("\`\`\`")) {
            result = result.substring(3)
        }
        if (result.endsWith("\`\`\`")) {
            result = result.substring(0, result.length - 3)
        }
        return result.trim()
    }
}`
  },
  {
    name: "QuizApp.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/ui/QuizApp.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.grammarwizard.mcq.data.QuizQuestion
import com.grammarwizard.mcq.viewmodel.QuizViewModel
import com.grammarwizard.mcq.viewmodel.ScreenState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizApp(viewModel: QuizViewModel) {
    val screenState by viewModel.screenState.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Grammar Wizard: MCQ", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            AnimatedContent(
                targetState = screenState,
                label = "ScreenTransitions"
            ) { state ->
                when (state) {
                    is ScreenState.SetupKey -> SetupKeyScreen(
                        onSave = { viewModel.saveApiKey(it) }
                    )
                    is ScreenState.QuizInput -> QuizInputScreen(
                        error = errorMessage,
                        onBuild = { viewModel.buildQuiz(it) }
                    )
                    is ScreenState.Loading -> LoadingScreen()
                    is ScreenState.ActiveQuiz -> {
                        val questions by viewModel.quizQuestions.collectAsState()
                        ActiveQuizScreen(
                            questions = questions,
                            userAnswers = viewModel.userAnswers,
                            currentIndex = viewModel.currentQuestionIndex.value,
                            onOptionSelected = { idx, opt -> viewModel.userAnswers[idx] = opt },
                            onNext = { viewModel.currentQuestionIndex.value++ },
                            onPrev = { viewModel.currentQuestionIndex.value-- },
                            onSubmit = { viewModel.submitQuiz() }
                        )
                    }
                    is ScreenState.QuizResults -> {
                        val questions by viewModel.quizQuestions.collectAsState()
                        QuizResultsScreen(
                            questions = questions,
                            userAnswers = viewModel.userAnswers,
                            score = viewModel.score.value,
                            onRestart = { viewModel.navigateToInput() },
                            onReviewKey = { viewModel.clearSavedKey() }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SetupKeyScreen(onSave: (String) -> Unit) {
    var keyText by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Welcome to Grammar Wizard!",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "To start conjuring multiple choice grammar quizzes, please configure your Google Gemini API Key.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(28.dp))

        OutlinedTextField(
            value = keyText,
            onValueChange = {
                keyText = it
                isError = false
            },
            label = { Text("Enter Google Gemini API Key") },
            placeholder = { Text("AIzaSy...") },
            isError = isError,
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        if (isError) {
            Text(
                text = "API Key cannot be blank.",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.align(Alignment.Start).padding(start = 4.dp, top = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (keyText.isBlank()) {
                    isError = true
                } else {
                    onSave(keyText.trim())
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Save Key & Launch", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun QuizInputScreen(error: String?, onBuild: (String) -> Unit) {
    var inputText by remember { mutableStateOf("") }
    var inputError by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Create a New English Grammar Quiz",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Paste your lesson paragraphs, rules, or grammar articles. The Wizard will craft 10 contextual MCQs tailored specifically to these rules.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(20.dp))

        if (error != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Warning, contentDescription = "Error", tint = MaterialTheme.colorScheme.onErrorContainer)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(text = error, color = MaterialTheme.colorScheme.onErrorContainer, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        OutlinedTextField(
            value = inputText,
            onValueChange = {
                inputText = it
                inputError = false
            },
            label = { Text("Paste Grammar Rules or Lesson Text") },
            placeholder = { Text("Example: Active and passive voice. We use active voice when the subject performs the action. We use passive voice when we want to emphasize the action or the receiver of the action. Example: 'The cat chased the mouse' (Active), 'The mouse was chased by the cat' (Passive)...") },
            modifier = Modifier.fillMaxWidth().weight(1f).minHeightIn(min = 250.dp),
            isError = inputError
        )
        if (inputError) {
            Text(
                text = "Please enter some rules or grammar descriptions to proceed.",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (inputText.isBlank()) {
                    inputError = true
                } else {
                    onBuild(inputText)
                }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Build Quiz", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun LoadingScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 4.dp,
            modifier = Modifier.size(56.dp)
        )
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "Conjuring Grammar Quiz...",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "The Wizard is weaving context and rules into 10 perfect MCQ challenges.",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
    }
}

@Composable
fun ActiveQuizScreen(
    questions: List<QuizQuestion>,
    userAnswers: Map<Int, Int>,
    currentIndex: Int,
    onOptionSelected: (Int, Int) -> Unit,
    onNext: () -> Unit,
    onPrev: () -> Unit,
    onSubmit: () -> Unit
) {
    val currentQuestion = questions[currentIndex]
    val selectedOption = userAnswers[currentIndex]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Progress Info
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Question \${currentIndex + 1} of 10",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "\${((currentIndex + 1) * 10)}% Done",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = (currentIndex + 1) / 10f,
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)),
            color = MaterialTheme.colorScheme.primary,
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
        Spacer(modifier = Modifier.height(24.dp))

        // Question Card
        Card(
            modifier = Modifier.fillMaxWidth().weight(1f),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = currentQuestion.question,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    lineHeight = 24.sp
                )
                Spacer(modifier = Modifier.height(24.dp))

                Column(modifier = Modifier.selectableGroup()) {
                    currentQuestion.options.forEachIndexed { optIndex, optionText ->
                        val isSelected = selectedOption == optIndex
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .border(
                                    width = 1.dp,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                                    shape = RoundedCornerShape(10.dp)
                                )
                                .background(if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)
                                .selectable(
                                    selected = isSelected,
                                    onClick = { onOptionSelected(currentIndex, optIndex) },
                                    role = Role.RadioButton
                                )
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { onOptionSelected(currentIndex, optIndex) }
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(text = optionText, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Navigation Footer
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = onPrev,
                enabled = currentIndex > 0,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Previous")
            }
            Spacer(modifier = Modifier.width(12.dp))
            if (currentIndex == 9) {
                Button(
                    onClick = onSubmit,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Submit Answers", fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = onNext,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Next")
                }
            }
        }
    }
}

@Composable
fun QuizResultsScreen(
    questions: List<QuizQuestion>,
    userAnswers: Map<Int, Int>,
    score: Int,
    onRestart: () -> Unit,
    onReviewKey: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Large score section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Grammar Wizard Score",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "\$score / 10",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = when {
                        score >= 9 -> "Exceptional! Absolute mastery."
                        score >= 7 -> "Good job! A solid performance."
                        score >= 5 -> "Passing. Keep reviewing!"
                        else -> "Needs improvement. Try another lesson!"
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Question review list
        Text(
            text = "Detailed Answer Breakdown",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            questions.forEachIndexed { index, question ->
                val userChoice = userAnswers[index]
                val correctIndex = question.correctAnswer
                val isCorrect = userChoice == correctIndex

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isCorrect) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Q\${index + 1}: \${question.question}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(
                                imageVector = if (isCorrect) Icons.Default.CheckCircle else Icons.Default.Close,
                                contentDescription = if (isCorrect) "Correct" else "Incorrect",
                                tint = if (isCorrect) Color(0xFF2E7D32) else Color(0xFFC62828),
                                modifier = Modifier.size(24.dp).padding(start = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        question.options.forEachIndexed { optIndex, option ->
                            val isUserSelected = userChoice == optIndex
                            val isCorrectOpt = correctIndex == optIndex

                            val itemColor = when {
                                isCorrectOpt -> Color(0xFF2E7D32) // Bold Green
                                isUserSelected -> Color(0xFFC62828) // Red
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            }

                            Row(
                                modifier = Modifier.padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = when (optIndex) {
                                        0 -> "A"
                                        1 -> "B"
                                        2 -> "C"
                                        else -> "D"
                                    } + ". " + option,
                                    color = itemColor,
                                    fontWeight = if (isCorrectOpt || isUserSelected) FontWeight.Bold else FontWeight.Normal,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Footer Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onRestart,
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Start New Quiz", fontWeight = FontWeight.SemiBold)
            }
            OutlinedButton(
                onClick = onReviewKey,
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Review Key")
            }
        }
    }
}
`
  },
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/MainActivity.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.grammarwizard.mcq.ui.QuizApp
import com.grammarwizard.mcq.ui.theme.GrammarWizardTheme
import com.grammarwizard.mcq.viewmodel.QuizViewModel

/**
 * Android Main Entry Activity bootstrapped to set up Compose content
 * with full state conservation via standard QuizViewModel.
 */
class MainActivity : ComponentActivity() {

    private val viewModel: QuizViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        
        setContent {
            GrammarWizardTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    QuizApp(viewModel)
                }
            }
        }
    }
}`
  },
  {
    name: "Theme.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/ui/theme/Theme.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD0BCFF),
    secondary = Color(0xFFCCC2DC),
    tertiary = Color(0xFFEFB8C8),
    background = Color(0xFF1C1B1F)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF625B71),
    tertiary = Color(0xFF7D5260),
    background = Color(0xFFFFFBFE),
    surface = Color(0xFFFFFBFE),
    onPrimary = Color(0xFFFFFFFF),
    onBackground = Color(0xFF1C1B1F),
    onSurface = Color(0xFF1C1B1F)
)

@Composable
fun GrammarWizardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES_S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}`
  },
  {
    name: "Typography.kt",
    path: "app/src/main/java/com/grammarwizard/mcq/ui/theme/Typography.kt",
    language: "kotlin",
    content: `package com.grammarwizard.mcq.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)`
  }
];

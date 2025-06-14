import words from "./word.js"

// Game state
let score = 0;
let streak = 0;
let timeLeft = 30;
let timer;
let currentWord = "";
let difficulty = "easy";
let category = "all";
let highScore = localStorage.getItem("highScore") || 0;
let achievements = JSON.parse(localStorage.getItem("achievements")) || {
    firstWin: false,
    streak5: false,
    streak10: false,
    score100: false,
    score500: false,
    perfectGame: false
};

// DOM Elements
const wordDisplay = document.querySelector(".word");
const hintText = document.querySelector(".hint span");
const categoryText = document.querySelector(".category span");
const timeText = document.querySelector(".time b");
const inputField = document.querySelector("input");
const checkBtn = document.querySelector(".check-word");
const refreshBtn = document.querySelector(".refresh-word");
const scoreDisplay = document.querySelector(".score");
const streakDisplay = document.querySelector(".streak");
const difficultySelect = document.querySelector(".difficulty-select");
const categorySelect = document.querySelector(".word-category");
const themeToggle = document.querySelector(".theme-toggle");
const progressBar = document.querySelector(".progress-bar");
const inputFeedback = document.querySelector(".input-feedback");
const achievementList = document.querySelector(".achievement-list");
const gameOverModal = document.querySelector(".game-over-modal");
const finalScoreDisplay = document.querySelector(".final-score span");
const highScoreDisplay = document.querySelector(".high-score span");
const playAgainBtn = document.querySelector(".play-again");

// Initialize achievements display
const initAchievements = () => {
    achievementList.innerHTML = `
        <div class="achievement ${achievements.firstWin ? 'unlocked' : ''}">
            <i class="fas ${achievements.firstWin ? 'fa-trophy' : 'fa-lock'}"></i>
            <span>First Win</span>
        </div>
        <div class="achievement ${achievements.streak5 ? 'unlocked' : ''}">
            <i class="fas ${achievements.streak5 ? 'fa-fire' : 'fa-lock'}"></i>
            <span>5x Streak</span>
        </div>
        <div class="achievement ${achievements.streak10 ? 'unlocked' : ''}">
            <i class="fas ${achievements.streak10 ? 'fa-fire' : 'fa-lock'}"></i>
            <span>10x Streak</span>
        </div>
        <div class="achievement ${achievements.score100 ? 'unlocked' : ''}">
            <i class="fas ${achievements.score100 ? 'fa-star' : 'fa-lock'}"></i>
            <span>Score 100</span>
        </div>
        <div class="achievement ${achievements.score500 ? 'unlocked' : ''}">
            <i class="fas ${achievements.score500 ? 'fa-star' : 'fa-lock'}"></i>
            <span>Score 500</span>
        </div>
        <div class="achievement ${achievements.perfectGame ? 'unlocked' : ''}">
            <i class="fas ${achievements.perfectGame ? 'fa-crown' : 'fa-lock'}"></i>
            <span>Perfect Game</span>
        </div>
    `;
};

// Theme toggle
themeToggle.addEventListener("click", () => {
    document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark";
    themeToggle.innerHTML = `<i class="fas fa-${document.body.dataset.theme === "dark" ? "sun" : "moon"}"></i>`;
    localStorage.setItem("theme", document.body.dataset.theme);
});

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.dataset.theme = "dark";
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

const shuffleWord = (word) => {
    const wordArray = word.split("");
    for (let i = wordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]];
    }
    return wordArray.join("");
};

const getRandomWord = () => {
    let filteredWords = words;
    if (category !== "all") {
        filteredWords = words.filter(word => word.category === category);
    }
    if (difficulty === "easy") {
        filteredWords = filteredWords.filter(word => word.word.length <= 5);
    } else if (difficulty === "medium") {
        filteredWords = filteredWords.filter(word => word.word.length > 5 && word.word.length <= 8);
    } else {
        filteredWords = filteredWords.filter(word => word.word.length > 8);
    }
    return filteredWords[Math.floor(Math.random() * filteredWords.length)];
};

const checkAchievements = () => {
    let newAchievements = false;
    
    if (!achievements.firstWin && score > 0) {
        achievements.firstWin = true;
        newAchievements = true;
    }
    if (!achievements.streak5 && streak >= 5) {
        achievements.streak5 = true;
        newAchievements = true;
    }
    if (!achievements.streak10 && streak >= 10) {
        achievements.streak10 = true;
        newAchievements = true;
    }
    if (!achievements.score100 && score >= 100) {
        achievements.score100 = true;
        newAchievements = true;
    }
    if (!achievements.score500 && score >= 500) {
        achievements.score500 = true;
        newAchievements = true;
    }
    if (!achievements.perfectGame && streak >= 20) {
        achievements.perfectGame = true;
        newAchievements = true;
    }

    if (newAchievements) {
        localStorage.setItem("achievements", JSON.stringify(achievements));
        initAchievements();
        playSound("achievement");
    }
};

const playSound = (type) => {
    const audio = new Audio();
    switch (type) {
        case "correct":
            audio.src = "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3";
            break;
        case "wrong":
            audio.src = "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3";
            break;
        case "achievement":
            audio.src = "https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3";
            break;
    }
    audio.play();
};

const showGameOver = () => {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
    finalScoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    gameOverModal.style.display = "flex";
};

const initGame = () => {
    clearInterval(timer);
    timeLeft = 30;
    const randomObj = getRandomWord();
    currentWord = randomObj.word;
    const scrambledWord = shuffleWord(currentWord);
    
    wordDisplay.textContent = scrambledWord;
    hintText.textContent = randomObj.hint;
    categoryText.textContent = randomObj.category || "General";
    timeText.textContent = timeLeft;
    inputField.value = "";
    inputField.focus();
    progressBar.style.width = "100%";
    
    timer = setInterval(() => {
        timeLeft--;
        timeText.textContent = timeLeft;
        progressBar.style.width = `${(timeLeft / 30) * 100}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            streak = 0;
            streakDisplay.textContent = `Streak: ${streak}`;
            playSound("wrong");
            showGameOver();
        }
    }, 1000);
};

const updateScore = (isCorrect) => {
    if (isCorrect) {
        score += 10 * (streak + 1);
        streak++;
        playSound("correct");
        inputFeedback.innerHTML = '<i class="fas fa-check"></i>';
        inputFeedback.className = "input-feedback correct";
    } else {
        streak = 0;
        playSound("wrong");
        inputFeedback.innerHTML = '<i class="fas fa-times"></i>';
        inputFeedback.className = "input-feedback incorrect";
    }
    
    scoreDisplay.textContent = `Score: ${score}`;
    streakDisplay.textContent = `Streak: ${streak}`;
    checkAchievements();
    
    setTimeout(() => {
        inputFeedback.className = "input-feedback";
    }, 1000);
};

// Event Listeners
checkBtn.addEventListener("click", () => {
    const userWord = inputField.value.toLowerCase().trim();
    if (!userWord) return;
    
    if (userWord === currentWord) {
        updateScore(true);
        initGame();
    } else {
        updateScore(false);
        inputField.value = "";
    }
});

inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        checkBtn.click();
    }
});

refreshBtn.addEventListener("click", initGame);

difficultySelect.addEventListener("change", (e) => {
    difficulty = e.target.value;
    initGame();
});

categorySelect.addEventListener("change", (e) => {
    category = e.target.value;
    initGame();
});

playAgainBtn.addEventListener("click", () => {
    gameOverModal.style.display = "none";
    score = 0;
    streak = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    streakDisplay.textContent = `Streak: ${streak}`;
    initGame();
});

// Initialize the game
initAchievements();
initGame();
// Declare variables
let score = parseInt(localStorage.getItem('mostRecentScore')) || 0;
let scoreDisplay = document.getElementById('score');
const themeToggle = document.getElementById('theme-toggle');
const body = document.querySelector('body');
const endGameContainer = document.getElementById('end-game-container');

// Retrieve the user's score from localStorage
const storedScore = localStorage.getItem('mostRecentScore');
if (storedScore !== null) {
    score = parseInt(storedScore);
    updateScore();
}

// Retrieve the user's chosen theme from localStorage
const storedTheme = localStorage.getItem('theme');
if (storedTheme !== null) {
    body.classList.add(storedTheme);
    themeToggle.checked = (storedTheme === 'dark');
}

// Theme toggle functionality
themeToggle.addEventListener('change', () => {
    body.classList.toggle('dark');
    const currentTheme = body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
});

const categorySelection = document.getElementById('category-selection');
const categorySelect = document.getElementById('category');
const startGameButton = document.getElementById('start-game');
const questionContainer = document.getElementById('question-container');
const question = document.getElementById('question');
const answerChoices = document.getElementById('answer-choices');
const nextQuestionButton = document.getElementById('next-question');
const scoreContainer = document.getElementById('score-container');
const resetScoreButton = document.getElementById('reset-score');

let currentQuestion = {};
let acceptingAnswers = false;
let questionCounter = 0;
let availableQuestions = [];
let selectedCategory = null;

// Fetch categories from the Open Trivia DB API
fetch('https://opentdb.com/api_category.php')
    .then(response => response.json())
    .then(data => {
        const categoryOptions = data.trivia_categories.map(category => `<option value="${category.id}">${category.name}</option>`);
        categorySelect.innerHTML = `<option value="">Select a Category</option>${categoryOptions.join('')}`;
    })
    .catch(error => {
        console.error('Error fetching categories:', error);
    });

// Start the game when the "Start Game" button is clicked
startGameButton.addEventListener('click', () => {
    selectedCategory = categorySelect.value;
    if (!selectedCategory) {
        alert('Please select a category');
        return;
    }

    startGame();
});

// Start the game
function startGame() {
    questionCounter = 0;
    updateScore();
    categorySelection.style.display = 'none';
    questionContainer.style.display = 'block';
    endGameContainer.style.display = 'none';
    fetchQuestions();
}

// Fetch questions from the Open Trivia DB API
function fetchQuestions() {
    const apiUrl = `https://opentdb.com/api.php?amount=10&category=${selectedCategory}&encode=url3986`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            availableQuestions = data.results.map(question => {
                const formattedQuestion = {
                    question: decodeURIComponent(question.question)
                };

                const answerChoices = [...question.incorrect_answers];
                const correctAnswer = decodeURIComponent(question.correct_answer);
                formattedQuestion.answer = answerChoices.length + 1;
                answerChoices.push(correctAnswer);
                answerChoices.sort(() => Math.random() - 0.5);

                answerChoices.forEach((choice, index) => {
                    formattedQuestion['choice' + (index + 1)] = decodeURIComponent(choice);
                });

                return formattedQuestion;
            });

            getNewQuestion();
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
        });
}

// Get a new question
function getNewQuestion() {
    if (availableQuestions.length === 0 || questionCounter >= 10) {
        showEndGameScreen();
        return;
    }

    questionCounter++;
    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerHTML = currentQuestion.question;

    answerChoices.innerHTML = '';
    const choices = Object.keys(currentQuestion).filter(key => key.startsWith('choice'));
    choices.forEach(choice => {
        const answerChoice = document.createElement('div');
        answerChoice.classList.add('answer-choice');
        answerChoice.innerHTML = currentQuestion[choice];
        answerChoice.addEventListener('click', () => {
            if (!acceptingAnswers) return;

            acceptingAnswers = false;
            const selectedChoice = answerChoice;
            const selectedAnswer = selectedChoice.textContent;

            const isCorrect = selectedAnswer === currentQuestion['choice' + currentQuestion.answer];
            const classToApply = isCorrect ? 'correct' : 'incorrect';

            // Remove previous classes
            Array.from(answerChoices.children).forEach(child => child.classList.remove('correct', 'incorrect'));

            if (isCorrect) {
                incrementScore(10);
            }

            selectedChoice.classList.add(classToApply);

            setTimeout(() => {
                getNewQuestion();
            }, 1000);
        });

        answerChoices.appendChild(answerChoice);
    });

    acceptingAnswers = true;
}

// Show the end game screen
function showEndGameScreen() {
    questionContainer.style.display = 'none';
    nextQuestionButton.style.display = 'none';
    endGameContainer.style.display = 'block';

    endGameContainer.innerHTML = `
        <h2>Congrats!</h2>
        <p>You finished your ${questionCounter} round of Trivia!</p>
        <div>
            <button id="continue-game">Continue</button>
            <button id="choose-category">Choose Another Category</button>
        </div>
    `;

    const continueButton = document.getElementById('continue-game');
    const chooseCategoryButton = document.getElementById('choose-category');

    continueButton.addEventListener('click', () => {
        endGameContainer.style.display = 'none';
        questionContainer.style.display = 'block';
        nextQuestionButton.style.display = 'block';
        availableQuestions = [];
        fetchQuestions();
    });

    chooseCategoryButton.addEventListener('click', () => {
        endGameContainer.style.display = 'none';
        categorySelection.style.display = 'block';
        questionContainer.style.display = 'none';
        nextQuestionButton.style.display = 'none';
        availableQuestions = [];
        selectedCategory = null;
    });
}

// Increment the score
function incrementScore(num) {
    score += num;
    updateScore();
}

// Update the score display
function updateScore() {
    scoreDisplay.textContent = score;
}

// Get the modal elements
const modal = document.getElementById('confirmation-modal');
const confirmResetButton = document.getElementById('confirm-reset');
const cancelResetButton = document.getElementById('cancel-reset');
const closeModal = document.getElementsByClassName('close')[0];

// Show the modal when the Reset Score button is clicked
resetScoreButton.addEventListener('click', () => {
    modal.style.display = 'block';
});

// Reset the score when the Confirm Reset button is clicked
confirmResetButton.addEventListener('click', () => {
    score = 0;
    updateScore();
    localStorage.removeItem('mostRecentScore');
    modal.style.display = 'none';
});

// Close the modal when the Cancel button or close button is clicked
cancelResetButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close the modal when the user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

nextQuestionButton.addEventListener('click', getNewQuestion);
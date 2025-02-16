let questionsArray = [];
let currentQuestionIndex = 0;
let score = 0;
let countdown;
let tim = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

async function fetchCategories() {
    console.log('Fetching categories...');
    try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        const categorySelect = document.getElementById('category');

        data.trivia_categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

document.getElementById('quiz-config-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;
    const type = document.getElementById('type').value;  // Get selected question type
    console.log('Starting quiz with category:', category, 'difficulty:', difficulty, 'type:', type);

    await fetchQuizQuestions(category, difficulty, type);
});

async function fetchQuizQuestions(category, difficulty, type) {
    const numQuestions = document.getElementById('number-of-questions').value;
    const url = `https://opentdb.com/api.php?amount=${numQuestions}&category=${category}&difficulty=${difficulty}&type=${type}`;

    console.log('Fetching quiz questions...');
    try {
        const response = await fetch(url);
        const data = await response.json();
        questionsArray.length = 0;

        data.results.forEach((questionData) => {
            let choices = [];
            if (type === 'boolean') {
                // For boolean (True/False) questions
                choices = ['True', 'False'];
            } else if (type === 'multiple') {
                // For multiple choice questions
                choices = [...questionData.incorrect_answers, questionData.correct_answer];
                shuffleArray(choices);  // Shuffle choices
            }

            const question = {
                question: questionData.question,
                choices: choices,
                correctAnswer: questionData.correct_answer
            };
            questionsArray.push(question);
        });

        console.log('Fetched questions:', questionsArray);
        startQuiz();
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
    }
}

function startQuiz() {
    console.log('Starting quiz...');
    document.querySelector('.quiz-config').style.display = 'none';
    document.querySelector('.container').style.display = 'flex';
    displayQuestion();
    startTimer();
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('envoyerButton').style.display = 'inline-block';
}

function displayQuestion() {
    console.log('Displaying question:', currentQuestionIndex);
    if (currentQuestionIndex < questionsArray.length) {
        const questionData = questionsArray[currentQuestionIndex];
        document.querySelector('.question_display').innerHTML = questionData.question;
        const choicesList = document.querySelector('.choices ul');
        choicesList.innerHTML = '';

        questionData.choices.forEach((choice, index) => {
            const listItem = document.createElement('li');
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.style.marginRight = '10px';
            radioInput.name = 'answer';
            radioInput.value = choice;
            radioInput.id = `choice-${String.fromCharCode(65 + index)}`;
            const label = document.createElement('label');
            label.setAttribute('for', radioInput.id);
            label.textContent = choice;
            listItem.appendChild(radioInput);
            listItem.appendChild(label);
            choicesList.appendChild(listItem);
        });

        document.querySelector('.score_value').textContent = `${score} / ${questionsArray.length} `;
    }
}

function startTimer() {
    let timeLeft = 11;
    tim = 0;
    const timerDisplay = document.getElementById("timer");

    countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft < 10 ? '0' + timeLeft : timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            tim = 1;
            alert("Time's up!");
            nextQuestion();
        }
    }, 1000);
}

function nextQuestion(event) {
    if (event) event.preventDefault();

    const selectedAnswer = document.querySelector('input[name="answer"]:checked') ? document.querySelector('input[name="answer"]:checked').value : null;
    const correctAnswer = questionsArray[currentQuestionIndex].correctAnswer;

    if (tim === 1 && !selectedAnswer) {
        // Handle case when time runs out and no answer is selected
    } else if (!selectedAnswer) {
        return;
    }

    if (selectedAnswer === correctAnswer) {
        score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < questionsArray.length) {
        displayQuestion();
        clearInterval(countdown);
        startTimer();
    } else {
        clearInterval(countdown);
        document.getElementsByClassName('time')[0].textContent = 'Quiz completed!';
        document.querySelector('.question_display').textContent = '';
        document.getElementById('envoyerButton').style.display = 'none';
        document.querySelector('.score').textContent = "";
        document.querySelector('.finalScore').style.display = 'flex';
        document.querySelector('.afficher').style.display = 'flex';
        document.querySelector('.finalScore').textContent = `${(score / questionsArray.length * 100).toFixed(2)} %`;
        document.getElementsByClassName('choices')[0].style.fontSize = '35px';

        if (score === questionsArray.length) {
            document.getElementsByClassName('choices')[0].textContent = 'Good Job';
        } else {
            document.getElementsByClassName('choices')[0].textContent = 'Try again';
        }
        document.getElementsByClassName("question")[0].style.display = 'none';
        document.getElementsByClassName("choices-part")[0].style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchCategories();
});

import React, { useState, useEffect } from 'react';
import { Text, View, Button, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Create Stack Navigator 
const Stack = createStackNavigator();

// Helper function to generate a random math problem based on difficulty
const generateProblem = (difficulty: string) => {
  let num1: number, num2: number, operation: string;
  let answer: number;
  let scenario: string;

  switch (difficulty) {
    case 'Apprentice':
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      break;
    case 'Wizard':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      break;
    case 'Sorcerer':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      break;
  }

  const operations = ['+', '-', '*', '/'];
  operation = operations[Math.floor(Math.random() * operations.length)];

  switch (operation) {
    case '+':
      answer = num1 + num2;
      scenario = `Arithmetica needs to mix two magical potions. Solve to find the total: `;
      break;
    case '-':
      if (num2 > num1) [num1, num2] = [num2, num1]; // Ensure non-negative result
      answer = num1 - num2;
      scenario = `To defeat a magical creature, Arithmetica must subtract its power. Find the difference: `;
      break;
    case '*':
      answer = num1 * num2;
      scenario = `Arithmetica is multiplying her magic energy. Calculate the total energy: `;
      break;
    case '/':
      num1 = num1 * num2; // Ensure division is possible
      answer = num1 / num2;
      scenario = `Arithmetica has a treasure and needs to share it equally among ${num2} friends. How much does each get? `;
      break;
  }

  return { question: `${num1} ${operation} ${num2}`, answer: answer.toString(), scenario };
};

// Function to get time limit based on difficulty
const getTimeLimit = (difficulty: string) => {
  switch (difficulty) {
    case 'Apprentice':
      return 30; // 30 seconds for easy questions
    case 'Wizard':
      return 20; // 20 seconds for medium questions
    case 'Sorcerer':
      return 15; // 15 seconds for hard questions
    default:
      return 30; // Default 30 seconds
  }
};

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Arithmetica's Magical Training</Text>
      <Text style={styles.subtitle}>Help Arithmetica master her arithmetic to pass her wizard exam!</Text>
      <Button title="Start Training" onPress={() => navigation.navigate('Game')} />
      <Button title="View Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
    </View>
  );
};

const GameScreen = ({ navigation }: { navigation: any }) => {
  const [problem, setProblem] = useState(generateProblem('Apprentice'));
  const [input, setInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(getTimeLimit('Apprentice'));
  const [difficulty, setDifficulty] = useState<string>('Apprentice');
  const [powerUpsEarned, setPowerUpsEarned] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0); // Track correct answers
  const [canLevelUp, setCanLevelUp] = useState<boolean>(false); // Track if the user can level up

  // Local leaderboard state
  const [leaderboard, setLeaderboard] = useState<number[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const storedScores = await AsyncStorage.getItem('leaderboard');
      if (storedScores) setLeaderboard(JSON.parse(storedScores));
    };
    fetchLeaderboard();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev! - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      Alert.alert('Time is up!', `Your final score: ${score}`);
      handleGameOver();
    }
  }, [timeLeft]);

  const handleSubmit = () => {
    if (input.trim() === '') {
      Alert.alert('Input Error', 'Please enter an answer before submitting.');
      return;
    }

    if (input === problem.answer) {
      setScore(score + 1);
      const newCorrectAnswers = correctAnswers + 1;
      setCorrectAnswers(newCorrectAnswers); // Increment correct answers count

      // Check for power-ups availability
      if (newCorrectAnswers % 5 === 0) {
        setPowerUpsEarned(1); // Earn a power-up after every 5 correct answers
        Alert.alert('Power-Up Earned!', 'You have earned a power-up!');
      }

      // Check if the user can level up after 10 correct answers
      if (newCorrectAnswers >= 10) {
        setCanLevelUp(true); // Allow user to level up
      }

      // Generate new problem and reset timer based on difficulty
      const newProblem = generateProblem(difficulty);
      setProblem(newProblem);
      setTimeLeft(getTimeLimit(difficulty));
      setInput('');
    } else {
      Alert.alert('Wrong Answer', `The correct answer is ${problem.answer}`);
      setInput(''); // Clear the input if the answer is wrong
    }
  };

  const levelUp = () => {
    if (difficulty === 'Apprentice') {
      setDifficulty('Wizard');
      Alert.alert('Level Up!', 'Congratulations! You are now a Wizard!');
    } else if (difficulty === 'Wizard') {
      setDifficulty('Sorcerer');
      Alert.alert('Level Up!', 'Amazing! You are now a Sorcerer!');
    } else {
      Alert.alert('Max Level Reached', 'You are already at the highest level!');
    }
    setCorrectAnswers(0); // Reset correct answers count after leveling up
    setCanLevelUp(false); // Reset level-up status
  };

  const handleActivatePowerUp = (type: string) => {
    switch (type) {
      case 'Double Score':
        setScore(score * 2);
        Alert.alert('Power-Up Activated!', 'Your score has been doubled!');
        break;
      case 'Reveal Answer':
        // Reveal part of the answer (here we can simply give the answer)
        Alert.alert('Revealed Answer', `The answer is: ${problem.answer}`);
        break;
      case 'Freeze Timer':
        setTimeLeft(timeLeft + 5);
        Alert.alert('Power-Up Activated!', 'Time has been extended by 5 seconds!');
        break;
    }
    // Reset power ups after activation
    setPowerUpsEarned(0);
  };

  const handleGameOver = async () => {
    const newLeaderboard = [...leaderboard, score];
    const uniqueScores = Array.from(new Set(newLeaderboard)); // Remove duplicates
    uniqueScores.sort((a, b) => b - a); // Sort in descending order
    setLeaderboard(uniqueScores);
    await AsyncStorage.setItem('leaderboard', JSON.stringify(uniqueScores));
    navigation.navigate('Result', { score });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Level: {difficulty}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}</Text>
      <Text style={styles.question}>{problem.scenario}</Text>
      <Text style={styles.question}>{problem.question}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your answer"
        value={input}
        onChangeText={setInput}
        keyboardType="numeric"
      />
      <Button title="Submit Answer" onPress={handleSubmit} />
      {powerUpsEarned > 0 && (
        <>
          <Button title="Activate Power-Up: Double Score" onPress={() => handleActivatePowerUp('Double Score')} />
          <Button title="Activate Power-Up: Reveal Answer" onPress={() => handleActivatePowerUp('Reveal Answer')} />
          <Button title="Activate Power-Up: Freeze Timer" onPress={() => handleActivatePowerUp('Freeze Timer')} />
        </>
      )}
      <Text style={styles.score}>Score: {score}</Text>
      {canLevelUp && (
        <Button title="Level Up!" onPress={levelUp} />
      )}
    </View>
  );
};

const ResultScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { score } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Over!</Text>
      <Text style={styles.subtitle}>Your final score: {score}</Text>
      <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<number[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const storedScores = await AsyncStorage.getItem('leaderboard');
      if (storedScores) setLeaderboard(JSON.parse(storedScores));
    };
    fetchLeaderboard();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {leaderboard.length === 0 ? (
        <Text style={styles.subtitle}>No scores yet!</Text>
      ) : (
        leaderboard.map((score, index) => (
          <Text key={index} style={styles.score}>
            {index + 1}. Score: {score}
          </Text>
        ))
      )}
      <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  question: {
    fontSize: 20,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    width: '80%',
    paddingHorizontal: 10,
  },
  timer: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
  },
  score: {
    fontSize: 20,
    marginTop: 20,
  },
});

export default App;

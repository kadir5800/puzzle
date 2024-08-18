"use client";
import { useEffect, useState } from 'react';
import Crossword from '../components/Crossword';
import questionsData from '../data/questions.json';

interface Question {
  question: string;
  answer: string;
}
interface QuestionDirec {
  question: string;
  answer: string;
  value: number;
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
}
interface Map {
  [key: string]: {
    number: number;
    direction: string;
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
    length: number;
    answer: string;
  };
}

const calculateGridSize = (questions: Question[]): number => {
  const first20Answers = questions.slice(0, 20);
  const totalLength = first20Answers.reduce((sum, q) => sum + q.answer.length, 0);
  let gridSize = Math.ceil(Math.sqrt(totalLength));
  const maxLength = Math.max(...questions.map(q => q.answer.length));
  gridSize = Math.max(gridSize, maxLength + 2);
  return gridSize;
};

const getOptimalQuestions = (questions: Question[], gridSize: number): Question[] => {
  return questions.filter(q => q.answer.length <= gridSize);
};

const generateGrid = (size: number): string[][] => {
  return Array.from({ length: size }, () => Array(size).fill(''));
};

const getRandomQuestions = (data: Question[], count: number): Question[] => {
  return data.sort(() => 0.5 - Math.random()).slice(0, count);
};

const countIntersections = (
  grid: string[][],
  word: string,
  x: number,
  y: number,
  direction: 'horizontal' | 'vertical'
): number => {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    const char = direction === 'horizontal' ? grid[y][x + i] : grid[y + i][x];
    if (char === word[i]) count++;
  }
  return count;
};

const canPlaceWord = (
  grid: string[][],
  word: string,
  x: number,
  y: number,
  direction: 'horizontal' | 'vertical',
  map: Map
): boolean => {
  const length = word.length;

  // Kelimenin grid sınırlarına sığmasını kontrol et
  if (direction === 'horizontal') {
    if (x + length > grid[0].length) return false;
  } else {
    if (y + length > grid.length) return false;
  }

  for (let i = 0; i < length; i++) {
    const char = word[i];
    const cellX = direction === 'horizontal' ? x + i : x;
    const cellY = direction === 'horizontal' ? y : y + i;
    const cellKey = `${cellY}-${cellX}`;

    // Hücre doluysa ve aynı karakteri içermiyorsa
    if (grid[cellY][cellX] !== '' && grid[cellY][cellX] !== char) {
      return false;
    }

    const existingWord = map[cellKey];
    // Aynı yönde başka bir kelime varsa, üzerine yazılmasını engelle
    if (existingWord && existingWord.direction === direction) {
      return false;
    }

    // Komşu hücrelerin kontrolü (harfler farklı olduğunda yan yana olmamalı)
    // if (grid[cellY][cellX] === '' || grid[cellY][cellX] === char) {
    //   if (direction === 'horizontal') {
    //     if (
    //       (cellY < grid.length - 1 && grid[cellY + 1][cellX] !== '' && grid[cellY + 1][cellX] !== char)
    //     ) {
    //       return false;
    //     }
    //   } else {
    //     if (
    //       (cellX > 0 && grid[cellY][cellX - 1] !== '' && grid[cellY][cellX - 1] !== char) 
    //     ) {
    //       return false;
    //     }
    //   }
    // }
  }

  // Kelimenin başı ve sonu için boş hücre kontrolü
  if (direction === 'horizontal') {
    if (x > 0 && grid[y][x - 1] !== '') return false;
    if (x + length < grid[0].length && grid[y][x + length] !== '') return false;
  } else {
    if (y > 0 && grid[y - 1][x] !== '') return false;
    if (y + length < grid.length && grid[y + length][x] !== '') return false;
  }

  return true;
};

const findBestFit = (
  grid: string[][],
  word: string,
  map: Map
): { x: number; y: number; direction: 'horizontal' | 'vertical' } | null => {
  const options: {
    x: number;
    y: number;
    direction: 'horizontal' | 'vertical';
    intersections: number;
  }[] = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      for (const direction of ['horizontal', 'vertical'] as const) {
        if (canPlaceWord(grid, word, x, y, direction, map)) {
          const intersections = countIntersections(
            grid,
            word,
            x,
            y,
            direction
          );
          options.push({ x, y, direction, intersections });
        }
      }
    }
  }

  if (options.length === 0) return null;
  options.sort((a, b) => b.intersections - a.intersections);
  return options[0];
};

const placeWord = (
  grid: string[][],
  word: string,
  x: number,
  y: number,
  direction: 'horizontal' | 'vertical'
): { xEnd: number; yEnd: number } => {
  for (let i = 0; i < word.length; i++) {
    if (direction === 'horizontal') {
      grid[y][x + i] = word[i];
    } else {
      grid[y + i][x] = word[i];
    }
  }
  return direction === 'horizontal'
    ? { xEnd: x + word.length - 1, yEnd: y }
    : { xEnd: x, yEnd: y + word.length - 1 };
};

const HomePage = () => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [horizontalQuestion, setHorizontalQuestion] = useState<QuestionDirec[]>([]);
  const [verticalQuestion, setVerticalQuestion] = useState<QuestionDirec[]>([]);
  const [questionMap, setQuestionMap] = useState<Map>({});
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDirec | null>(null);
  const [score, setScore] = useState(0);

  const handleCorrectAnswer = (value: number) => {
    setScore((prevScore) => prevScore + value);
  };

  const generateQuestionMap = (questions: Question[], gridSize: number) => {
    const map: Map = {};
    let currentIndex = 1;

    const grid = generateGrid(gridSize);
    const horizontalList: QuestionDirec[] = [];
    const verticalList: QuestionDirec[] = [];

    questions.forEach((q) => {
      const bestFit = findBestFit(grid, q.answer, map);
      if (bestFit) {
        const { xEnd, yEnd } = placeWord(
          grid,
          q.answer,
          bestFit.x,
          bestFit.y,
          bestFit.direction
        );
        const cellKey = `${bestFit.y}-${bestFit.x}`;
        if (map[cellKey]) {
          console.warn(`Çakışma tespit edildi: ${cellKey}`);
        } else {
          map[cellKey] = {
            number: currentIndex,
            direction: bestFit.direction,
            xStart: bestFit.x,
            yStart: bestFit.y,
            xEnd,
            yEnd,
            length: q.answer.length,
            answer: q.answer,
          };

          const list =
            bestFit.direction === 'horizontal'
              ? horizontalList
              : verticalList;

          list.push({
            question: q.question,
            answer: q.answer,
            value: currentIndex,
            xStart: bestFit.x,
            yStart: bestFit.y,
            xEnd,
            yEnd,
          });

          currentIndex++;
        }
      }
    });

    setGrid(grid);
    setQuestionMap(map);
    setHorizontalQuestion(horizontalList);
    setVerticalQuestion(verticalList);
  };

  useEffect(() => {
    const data = questionsData as Question[];
    const cleanedData = data.map((item) => ({
      question: item.question,
      answer: item.answer.replace(' ', ''),
    }));
    const selectedQuestions = getRandomQuestions(cleanedData, 80);
    const gridSize = calculateGridSize(selectedQuestions);
    const optimalQuestions = getOptimalQuestions(cleanedData, gridSize);

    const initialGrid = generateGrid(gridSize);
    generateQuestionMap(optimalQuestions, gridSize);
    setGrid(initialGrid);
    setQuestions(optimalQuestions);
  }, []);

  return (
    <div
      className='container'
    >
      <div
        style={{
          flex: '1 1 100%', // Bulmacayı tam genişlikte göster
          maxWidth: '100%',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#fff',
          padding: '20px',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={{ color: '#333', marginBottom: 10 }}>Kare Bulmaca</h1>
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            marginBottom: 20,
            padding: '10px 0',
            backgroundColor: '#e0f7fa',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            color: '#007BFF',
            fontSize: '18px',
          }}
        >
          {score}
        </div>
        {grid.length === 0 ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : (
          <Crossword
            setScore={handleCorrectAnswer}
            selectedAnswer={selectedQuestion?.answer}
            puzzle={grid}
            setPuzzle={setGrid}
            questionMap={questionMap}
          />
        )}
      </div>
      <div className='question-container'
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            flex: '1 1 100%', // Ekran küçüldüğünde soruları altta göstermek için
          }}
        >
          <h2 style={{ color: '#555' }}>Sol&#39;dan Sağ&#39;a</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {horizontalQuestion.map((q) => (
              <li
                key={q.value}
                onClick={() => setSelectedQuestion(q)}
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  margin: '5px 0',
                  backgroundColor:
                    selectedQuestion?.value === q.value ? '#e0f7fa' : '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  boxShadow:
                    selectedQuestion?.value === q.value
                      ? '0 0 5px rgba(0, 0, 0, 0.2)'
                      : 'none',
                }}
              >
                <strong style={{ color: '#007BFF' }}>{q.value}.</strong>
                {q.question}
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            flex: '1 1 100%', // Ekran küçüldüğünde soruları altta göstermek için
          }}
        >
          <h2 style={{ color: '#555' }}>Yukarıdan Aşağıya</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {verticalQuestion.map((q) => (
              <li
                key={q.value}
                onClick={() => setSelectedQuestion(q)}
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  margin: '5px 0',
                  backgroundColor:
                    selectedQuestion?.value === q.value ? '#e0f7fa' : '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  boxShadow:
                    selectedQuestion?.value === q.value
                      ? '0 0 5px rgba(0, 0, 0, 0.2)'
                      : 'none',
                }}
              >
                <strong style={{ color: '#007BFF' }}>{q.value}.</strong>
                {q.question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
  
};

export default HomePage;
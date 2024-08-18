"use client";
import React, { useEffect, useState } from 'react';

interface CrosswordProps {
  puzzle: string[][];
  setPuzzle: React.Dispatch<React.SetStateAction<string[][]>>;
  selectedAnswer: string | null | undefined;
  questionMap: { [key: string]: { number: number, direction: string, xStart: number, yStart: number, xEnd: number, yEnd: number, length: number, answer: string; } };
  setScore:(value:number)=> void,
}

const Crossword: React.FC<CrosswordProps> = ({ puzzle, setPuzzle, questionMap, selectedAnswer,setScore }) => {
  const gridSize = puzzle.length > 0 ? puzzle[0].length : 0;
  const [answerList, setAnswerList] = useState<{ x: number, y: number, direction: string; answer: string }[]>([]);
  const maxCellSize = 50;
  
  // Calculate the cell size with a scaling factor
  const cellSize = Math.min(maxCellSize, window.innerWidth / gridSize / 2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const newPuzzle = [...puzzle];
    newPuzzle[rowIndex][colIndex] = e.target.value.toUpperCase();
    setPuzzle(newPuzzle);
  };

  useEffect(() => {
    console.log(questionMap);
    
    const updatedAnswerList: { x: number, y: number, direction: string; answer: string }[] = [];
    Object.values(questionMap).forEach((question) => {
      const { xStart, yStart, direction, answer, length } = question;
      for (let i = 0; i < length; i++) {
        if (direction === "horizontal") {
          updatedAnswerList.push({ x: xStart + i, y:yStart, answer, direction });
        } else {
          updatedAnswerList.push({ x:xStart, y: yStart + i, answer, direction });
        }
      }
    });

    setAnswerList(updatedAnswerList);
  }, [puzzle, questionMap]);

  const checkAnswerCompletion = (x: number, y: number, direction: string, answer: string): boolean => {
    if (direction === 'horizontal') {
      return puzzle[y].slice(x, x + answer.length).every(cell => cell !== '');
    } else if (direction === 'vertical') {
      for (let i = 0; i < answer.length; i++) {
        if (puzzle[y + i][x] === '') {
          return false;
        }
      }
      return true;
    }
    return false;
  };
  const checkAnswerCorrectness = (x: number, y: number, direction: string, answer: string): boolean => {
    if (direction === 'horizontal') {
      const answerStr = puzzle[y].slice(x, x + answer.length).join('');
      return answerStr === answer;
    } else if (direction === 'vertical') {
      let answerStr = '';
      for (let i = 0; i < answer.length; i++) {
        answerStr += puzzle[y + i][x];
      }
      return answerStr === answer;
    }
    return false;
  };
 
  
  const isAnswerComplete = (rowIndex: number, colIndex: number): boolean => {
    const answer = answerList.filter(item => item.x === colIndex && item.y === rowIndex);
    var result = false;
    if (answer.length == 0 ) {
      return false;
    }
    answer.forEach(element => {
      let firstAns=answerList.find(f=> f.answer == element.answer)!!;
      var resultx=checkAnswerCompletion(firstAns.x, firstAns.y, firstAns.direction, firstAns.answer);
      if (resultx) result = true;
    });
    return  result; 
  };

  const isAnswerCorrect = (rowIndex: number, colIndex: number): boolean => {
    const answer = answerList.filter(item => item.x === colIndex && item.y === rowIndex);
    var result = false;
    
    if (answer.length == 0 ) {
      return false;
    }
    answer.forEach(element => {
      let firstAns=answerList.find(f=> f.answer == element.answer)!!;
      var resultx=checkAnswerCorrectness(firstAns.x, firstAns.y, firstAns.direction, firstAns.answer);
     if (resultx){
       result = true;
      //  let lastAns=answerList.findLast(f=> f.answer == element.answer)!!;
      //  if (rowIndex==lastAns.y && colIndex ==lastAns.x) {
      //    setScore(100);
      //  }
    }
    });
    
    return result;
  };

  const isAnswerSelected = (rowIndex: number, colIndex: number): boolean => {
    return answerList.some(item => item.x === colIndex && item.y === rowIndex && item.answer === selectedAnswer);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: '1px' }}>
    {puzzle.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        const isWhite = answerList.some(item => item.x === colIndex && item.y === rowIndex);
        const isComplete = isAnswerComplete(rowIndex, colIndex);
        const isCorrect = isComplete && isAnswerCorrect(rowIndex, colIndex);
        const isSelected = isAnswerSelected(rowIndex, colIndex);

        return (
          <div
            key={cellKey}
            className={`cell ${isWhite ? 'cell-white' : 'cell-black'} ${isComplete ? (isCorrect ? 'complete correct' : 'complete incorrect') : ''} ${isSelected ? 'selected' : ''}`}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isWhite && (
              <input
                type="text"
                maxLength={1}
                value={cell}
                onChange={(e) => handleChange(e, rowIndex, colIndex)}
                disabled={isCorrect} // Tamamlanmış hücreler düzenlenemez
                className="cell-input"
                style={{ width: '100%', height: '100%', textAlign: 'center', fontSize: `${cellSize / 2}px` }}
              />
            )}
            {questionMap[cellKey] !== undefined && (
              <div className="question-number" style={{ position: 'absolute', top: '0', left: '0', fontSize: `${cellSize / 4}px` }}>
                {questionMap[cellKey].number}
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
);
};

export default Crossword;

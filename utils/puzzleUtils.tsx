// utils/puzzleUtils.ts
interface Question {
    question: string;
    answer: string;
  }
  
  const placeWordInGrid = (grid: string[][], word: string, row: number, col: number, direction: 'horizontal' | 'vertical') => {
    const length = word.length;
  
    if (direction === 'horizontal') {
      for (let i = 0; i < length; i++) {
        grid[row][col + i] = word[i];
      }
    } else if (direction === 'vertical') {
      for (let i = 0; i < length; i++) {
        grid[row + i][col] = word[i];
      }
    }
  };
  
  export const fillGridWithWords = (grid: string[][], questions: Question[]) => {
    // Basit yerleştirme mantığı (daha karmaşık algoritmalar gerektirebilir)
    questions.forEach((q, index) => {
      const row = index % grid.length; // Örnek yerleştirme algoritması
      const col = Math.floor(index / grid.length);
      const direction: 'horizontal' | 'vertical' = index % 2 === 0 ? 'horizontal' : 'vertical';
  
      placeWordInGrid(grid, q.answer, row, col, direction);
    });
  
    return grid;
  };
  
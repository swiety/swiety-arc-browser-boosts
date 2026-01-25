/*
 Arc Browser boost for Rallly polls that sorts date columns by weighted attendance score.
 Weights: Yes = 1.0, If Need Be = 0.7, No = -0.3
 Sorts highest score on left, lowest on right. Equal scores sorted chronologically.
 */

const WEIGHTS = {
    'Yes': 1.0,
    'If Need Be': 0.7,
    'No': -0.3
};

function parseDateFromColumn(column) {
    // Try to find date text in the column header
    const header = column.querySelector('th, [class*="header"], [class*="date"], [class*="column-header"]');
    if (header) {
        const text = header.textContent.trim();
        // Try to parse common date formats
        const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (dateMatch) {
            return new Date(dateMatch[3], dateMatch[2] - 1, dateMatch[1]);
        }
        // Try ISO format
        const isoMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (isoMatch) {
            return new Date(isoMatch[1], isoMatch[2] - 1, isoMatch[3]);
        }
    }
    
    // Fallback: use data attributes or other indicators
    const dataDate = column.getAttribute('data-date') || column.getAttribute('data-id');
    if (dataDate) {
        const parsed = new Date(dataDate);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    
    // Last resort: return current date to maintain order
    return new Date();
}

function sortColumnsByAttendance() {
    console.info('Starting Rallly column sorting by attendance...');
    
    // Find the container that holds all date columns
    // Rallly typically uses a table structure
    const table = document.querySelector('table');
    if (!table) {
        console.warn('Could not find table container');
        return;
    }
    
    // Find the header row with date columns
    const headerRow = table.querySelector('thead tr, tr:first-child');
    if (!headerRow) {
        console.warn('Could not find header row');
        return;
    }
    
    // Get all header cells (skip the first one which is usually participant names)
    const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
    if (headerCells.length < 2) {
        console.warn('Not enough columns found');
        return;
    }
    
    // Skip the first column (participant names) and get date columns
    const dateColumns = headerCells.slice(1);
    
    console.info(`Found ${dateColumns.length} date columns`);
    
    // Get all data rows
    const dataRows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));
    
    // Calculate scores and dates for each column
    const columnData = dateColumns.map((headerCell, index) => {
        // For each column, we need to get all cells in that column position
        const columnCells = dataRows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            return cells[index + 1]; // +1 to skip first column
        }).filter(cell => cell !== undefined);
        
        // Calculate score based on all cells in this column
        let score = 0;
        columnCells.forEach(cell => {
            if (!cell) return;
            
            const text = cell.textContent.trim().toLowerCase();
            const className = (cell.className || '').toLowerCase();
            const style = cell.getAttribute('style') || '';
            
            // Check for visual indicators (Rallly uses color coding)
            const isGreen = className.includes('green') || style.includes('green') ||
                           cell.querySelector('[class*="green"], [style*="green"]');
            const isYellow = className.includes('yellow') || className.includes('orange') ||
                            style.includes('yellow') || style.includes('orange') ||
                            cell.querySelector('[class*="yellow"], [class*="orange"]');
            const isRed = className.includes('red') || style.includes('red') ||
                         cell.querySelector('[class*="red"], [style*="red"]');
            
            // Determine response type
            if (text.includes('yes') || isGreen) {
                score += WEIGHTS['Yes'];
            } else if (text.includes('if need be') || text.includes('maybe') || isYellow) {
                score += WEIGHTS['If Need Be'];
            } else if (text.includes('no') || isRed) {
                score += WEIGHTS['No'];
            }
        });
        
        const date = parseDateFromColumn(headerCell);
        console.debug(`Column ${index}: score=${score.toFixed(2)}, date=${date.toLocaleDateString()}`);
        
        return {
            headerElement: headerCell,
            columnIndex: index + 1, // +1 to account for first column
            score: score,
            date: date,
            originalIndex: index
        };
    });
    
    // Sort by score (descending), then by date (ascending for chronological order)
    columnData.sort((a, b) => {
        if (Math.abs(a.score - b.score) > 0.01) {
            return b.score - a.score; // Higher score first
        }
        return a.date - b.date; // Earlier date first for equal scores
    });
    
    console.info('Sorted columns:', columnData.map((c, i) => 
        `Position ${i}: score=${c.score.toFixed(2)}, date=${c.date.toLocaleDateString()}`
    ));
    
    // Reorder columns in the DOM
    // First, reorder header cells
    const firstHeaderCell = headerCells[0];
    dateColumns.forEach(col => col.remove());
    columnData.forEach(colData => {
        headerRow.appendChild(colData.headerElement);
    });
    if (firstHeaderCell && firstHeaderCell !== headerRow.firstElementChild) {
        headerRow.insertBefore(firstHeaderCell, headerRow.firstElementChild);
    }
    
    // Then reorder cells in each data row
    dataRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length < 2) return;
        
        const firstCell = cells[0]; // Participant name cell
        const dateCells = cells.slice(1);
        
        // Create a map from original column index to cell
        const cellMap = new Map();
        dateColumns.forEach((header, idx) => {
            if (dateCells[idx]) {
                cellMap.set(idx, dateCells[idx]);
            }
        });
        
        // Remove all cells
        cells.forEach(cell => cell.remove());
        
        // Add first cell back
        if (firstCell) {
            row.appendChild(firstCell);
        }
        
        // Add date cells in new order
        columnData.forEach(colData => {
            const cell = cellMap.get(colData.originalIndex);
            if (cell) {
                row.appendChild(cell);
            }
        });
    });
    
    console.info('Columns reordered successfully');
}

// Wait for page to load and poll structure to be ready
function waitAndSort() {
    const maxAttempts = 30;
    let attempts = 0;
    
    const interval = setInterval(() => {
        attempts++;
        const table = document.querySelector('table, [role="table"], [class*="table"], [class*="grid"]');
        
        if (table || attempts >= maxAttempts) {
            clearInterval(interval);
            if (table) {
                // Small delay to ensure all content is rendered
                setTimeout(sortColumnsByAttendance, 500);
            } else {
                console.warn('Table/grid not found after maximum attempts');
            }
        }
    }, 200);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndSort);
} else {
    waitAndSort();
}

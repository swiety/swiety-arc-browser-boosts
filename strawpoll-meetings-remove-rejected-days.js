/*
 Arc Browser boost removing all the meeting days when at least one person flagged unavailability.
 */

function removeCrossedDays() {
    const days = document.querySelectorAll('div[x-ref="dataGridContainer"] > div.flex.overflow-auto.relative > div:not(.sticky)');
    console.info('Found total of strawpoll meeting days: ', days.length);
    days.forEach(function (day) {
        const redCount = day.querySelectorAll('.bg-red-50').length;
        console.debug('Found ', redCount, ' red values');
        if (redCount > 0) {
            console.debug('Day removed because non zero red values found: ', redCount);
            day.remove();
        }
    });
}

setTimeout(removeCrossedDays, 3000);
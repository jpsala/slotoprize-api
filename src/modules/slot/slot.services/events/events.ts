import schedule from 'node-schedule'
export const runEvents1 = (): void => {
  const startTime = new Date(Date.now() + 5000)
  const endTime = new Date(startTime.getTime() + 5000)
  const j = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/1 * * * * *' }, function(){
    console.log('Time for tea!')
  })
}
export const runEvents2 = (): void => {
  const j = schedule.scheduleJob('* * * * * *', function () {
    console.log('The answer to life, the universe, and everything!')
  })
}

runEvents1()
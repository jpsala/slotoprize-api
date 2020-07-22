import schedule from 'node-schedule'
xit('schedule first test', () => {
  const j = schedule.scheduleJob('* * * * * *', function(){
    console.log('The answer to life, the universe, and everything!')
  })
})
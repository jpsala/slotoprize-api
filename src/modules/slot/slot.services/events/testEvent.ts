import later from '@breejs/later'
import { format } from 'date-fns'
later.date.localTime()
const periods = [
  { type: 'cron', rule: '0 */2 * * * * *' },
  { type: 'unique', start: '2020-10-03 11:00:00', end: '2020-11-03 11:00:10' },
  {
    type: 'daily', hours: [
      { start: '8:30' },
      { start: '9:30' },
      { start: '10:00'},
    ]
  },
  {
    type: 'weekly', days: [
      {
        day: 5,
        hours: [
          { start: '6', duration: 1 },
          { start: '7', duration: 1 },
          { start: '9', duration: 1 },
        ]
      },
      {
        day: 6,
        hours: [
          { start: '4', duration: 1 },
          { start: '5', duration: 1 },
          { start: '6', duration: 1 },
        ]
      },
    ]
  }
]
console.clear()
export const run = (): void  => {
  periods.forEach(period => {
    console.warn('period', period)
    let schedData
    if (period.type === 'cron') 
      schedData = later.parse.cron(period.rule, true)
    if (period.type === 'daily') {
      schedData = later.parse.recur()
      period.hours?.forEach(_hour => {
        const { hour, minute, second } = splitHour(_hour)
        console.log('hour, minute, second', hour, minute, second)
        schedData.and().on(hour).hour().on(minute ?? 0).minute().on(second ?? 0).second()
      })
    }
    else if (period.type === 'unique' && period.start) {
      const { year, month, day } = splitDate(period.start)
      schedData = later.parse.recur()
      schedData.and().on(year).year().on(month).month().on(day).dayOfMonth()
    }
    else if (period.type === 'weekly') {
      schedData = later.parse.recur()
      period.days?.forEach(_day => {
        _day?.hours?.forEach(_hour => {
          const { hour, minute, second } = splitHour(_hour)
          schedData.and().on(_day.day).dayOfWeek().on(hour).hour().on(minute).minute().on(second ?? 0).second()
        })
      })
    }
    const sched = later.schedule(schedData)
    const next = sched.next(10, new Date())
    for (const n of next)  
      console.log(format(n, 'dd/MM/yyyy - MMM EEE - HH:mm:ss'))
  })
}


function splitDate(date):  {year: number,month: number, day: number} {
  const [year, month, day] = date.split('-')
  return {year: Number(year), month: Number(month), day: Number(day)}
}

function splitHour(_hour: { start: string; }): {hour: number, minute: number, second: number} {
  const [hour, minute, second] = _hour.start.split(':')
  return {hour: Number(hour), minute: Number(minute??0), second: Number(second??0)}
}
/*
1. De única vez
   fecha y hora de inicio y fecha y hora de finalización
2. con periodicidad
   dia - semana
   1. dia
     N por día - hora de inicio - duración en minutos (aclarar minutos en backoffice)
3. semana
   Que días (elijo de 1 a 7 dias)
     1. dia
       N por día - hora de inicio - duración en minutos (aclarar minutos en backoffice)

*/
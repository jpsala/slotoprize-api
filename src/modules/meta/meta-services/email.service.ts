import nodemailer from 'nodemailer'

export async function sendMail(to = 'jpsala@gmail.com', subject: string, html: string, userEmail: string): Promise<void>{
  const transporter = nodemailer.createTransport({
    host: 'SSL0.OVH.NET',
    port: 465,auth: {user: 'support@tagadagames.com',pass: 'wopidom-lani0363'}
  })

  console.log('send email to',  to)
  await transporter.sendMail({from: userEmail, to, subject, html})

}
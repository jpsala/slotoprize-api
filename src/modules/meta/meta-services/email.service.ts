import nodemailer from 'nodemailer'

export async function sendMail(to = 'jpsala@gmail.com', subject: string, html: string): Promise<void>{
  const transporter = nodemailer.createTransport({
    host: 'SSL0.OVH.NET',
    port: 465,auth: {user: 'support@tagadagames.com',pass: 'wopidom-lani0363'}
  })

  await transporter.sendMail({from: to, to, subject, html})

}
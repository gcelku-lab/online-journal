import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

export async function POST(request: NextRequest) {
  console.log('=== R2 환경변수 확인 ===')
  console.log('BUCKET_NAME:', JSON.stringify(process.env.R2_BUCKET_NAME))
  console.log('ACCOUNT_ID 있음:', !!process.env.R2_ACCOUNT_ID)
  console.log('ACCESS_KEY 있음:', !!process.env.R2_ACCESS_KEY_ID)
  console.log('SECRET 있음:', !!process.env.R2_SECRET_ACCESS_KEY)
  console.log('PUBLIC_URL:', JSON.stringify(process.env.NEXT_PUBLIC_R2_PUBLIC_URL))

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const key = formData.get('key') as string | null

    if (!file || !key) {
      return NextResponse.json({ error: 'file and key are required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      })
    )

    const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
    return NextResponse.json({ url })
  } catch (err) {
    console.error('R2 업로드 실패:', err)
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }
}
export default function handler(req: any, res: any) {
  res.status(200).json({ message: 'API is working!', time: new Date().toISOString() })
}

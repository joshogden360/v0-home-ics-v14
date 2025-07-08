import { redirect } from "next/navigation"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Redirect to the new path
  const { id } = await params
  return redirect(`/items/${id}/add-media`)
}

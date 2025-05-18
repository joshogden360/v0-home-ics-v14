import { redirect } from "next/navigation"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Redirect to the new path
  return redirect(`/items/${params.id}/add-media`)
}

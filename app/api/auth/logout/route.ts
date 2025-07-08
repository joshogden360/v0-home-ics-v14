import { redirect } from "next/navigation"
import { deleteSession } from "@/lib/session"

export async function GET() {
  // Clear the user session
  await deleteSession()
  
  console.log('✅ User logged out and session cleared')
  
  // Redirect to login page
  return redirect('/login?message=logged_out')
} 
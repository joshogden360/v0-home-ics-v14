import { NewRoomForm } from "./new-room-form"

export default function NewRoomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Room</h1>
        <p className="text-muted-foreground">Add a new room to your apartment</p>
      </div>

      <NewRoomForm />
    </div>
  )
}

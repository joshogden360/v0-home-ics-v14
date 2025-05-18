import { getRoomById, getRoomItems, getRoomMedia, getRoomDocuments } from "@/lib/actions/rooms"
import { getItems } from "@/lib/actions/items"
import { notFound } from "next/navigation"
import { EditRoomForm } from "./edit-room-form"

export default async function EditRoomPage({
  params,
}: {
  params: { id: string }
}) {
  const roomId = Number.parseInt(params.id)
  const room = await getRoomById(roomId)

  if (!room) {
    notFound()
  }

  const items = await getItems()
  const roomItems = await getRoomItems(roomId)
  const roomMedia = await getRoomMedia(roomId)
  const roomDocuments = await getRoomDocuments(roomId)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Room</h1>
      <EditRoomForm
        room={room}
        items={items}
        roomItems={roomItems}
        roomMedia={roomMedia}
        roomDocuments={roomDocuments}
      />
    </div>
  )
}

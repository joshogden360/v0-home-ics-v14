import { getDocumentById } from "@/lib/actions/documents"
import { NewVersionForm } from "./new-version-form"
import { notFound } from "next/navigation"

export default async function NewVersionPage({
  params,
}: {
  params: { id: string }
}) {
  const documentId = Number.parseInt(params.id)
  const document = await getDocumentById(documentId)

  if (!document) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Version</h1>
        <p className="text-muted-foreground">
          Create a new version of <span className="font-medium">{document.title}</span>
        </p>
      </div>

      <NewVersionForm document={document} />
    </div>
  )
}

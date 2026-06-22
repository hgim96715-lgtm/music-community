import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}:{children:React.ReactNode}){
    const session=await auth();
    if(!session?.user){
        redirect("/login?callbackUrl=/admin")
    }
    if(session.user.role !== "admin"){
        redirect("/")
    }
    return (
        <div className="min-h-full flex-1 bg-neutral-100">
          <header className="border-b border-neutral-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-sm font-semibold text-neutral-900">Admin</Link>
                <Link href="/admin/recommendations" className="text-sm text-neutral-600 hover:text-neutral-900">추천 관리</Link>
              </div>
              <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">피드로</Link>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
      );
    
}
import React, { ReactNode } from "react"

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative">
      <div className="flex">

        <section className="flex min-h-screen flex-1 flex-col px-6 pb-6 pt-28 max-md:pb-14 sm:px-14">
          <div className="w-full">{children}</div>
        </section>
      </div>
    </main>
  )
}

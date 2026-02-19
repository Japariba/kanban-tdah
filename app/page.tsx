import Link from "next/link";

export default function Home() {
  
  return (
    <main className="bg-gray-950 text-white">
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Um Kanban simples para quem tem TDAH
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            Organize suas tarefas de forma visual, sem distrações e com foco
            no que realmente importa.
          </p>

          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Começar gratuitamente
          </Link>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              Visual e simples
            </h3>
            <p className="text-gray-400">
              Sem menus complexos ou distrações. Apenas o essencial.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              Foco no agora
            </h3>
            <p className="text-gray-400">
              Veja apenas as tarefas importantes do momento.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              Acesso em qualquer lugar
            </h3>
            <p className="text-gray-400">
              Use no celular, tablet ou computador.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            Como funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-500 mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">
                Crie suas tarefas
              </h4>
              <p className="text-gray-400">
                Adicione o que precisa ser feito em poucos segundos.
              </p>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-500 mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">
                Organize no Kanban
              </h4>
              <p className="text-gray-400">
                Arraste as tarefas conforme avança.
              </p>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-500 mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">
                Finalize com foco
              </h4>
              <p className="text-gray-400">
                Visualize o progresso e mantenha a motivação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-blue-600 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Comece a organizar sua rotina hoje
        </h2>

        <Link
          href="/login"
          className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
        >
          Criar minha conta
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Kanban TDAH. Todos os direitos reservados.
      </footer>
    </main>
  );
}

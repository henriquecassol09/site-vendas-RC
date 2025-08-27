// Script para adicionar dados de exemplo ao Firebase
// Execute este script apenas uma vez para inicializar o banco de dados

// Import Firebase modules
const firebase = require("firebase/app")
require("firebase/firestore")
require("firebase/auth")

// Initialize Firebase
const config = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}
firebase.initializeApp(config)

const db = firebase.firestore()

async function seedDatabase() {
  // Verificar se já existem produtos
  const produtosSnapshot = await db.collection("produtos").get()

  if (!produtosSnapshot.empty) {
    console.log("O banco de dados já contém produtos. Cancelando a inicialização.")
    return
  }

  console.log("Inicializando banco de dados com dados de exemplo...")

  // Produtos de exemplo
  const produtosExemplo = [
    {
      codigo: "MT001",
      nome: "Filtro de Óleo",
      categoria: "Motor",
      quantidade: 50,
      preco: 25.9,
      estoqueMinimo: 10,
      dataCadastro: new Date().toISOString(),
    },
    {
      codigo: "FR001",
      nome: "Pastilha de Freio Dianteira",
      categoria: "Freios",
      quantidade: 30,
      preco: 89.9,
      estoqueMinimo: 5,
      dataCadastro: new Date().toISOString(),
    },
    {
      codigo: "SU001",
      nome: "Amortecedor Traseiro",
      categoria: "Suspensão",
      quantidade: 8,
      preco: 245.0,
      estoqueMinimo: 3,
      dataCadastro: new Date().toISOString(),
    },
  ]

  // Adicionar produtos ao Firestore
  const batch = db.batch()

  produtosExemplo.forEach((produto) => {
    const produtoRef = db.collection("produtos").doc()
    batch.set(produtoRef, produto)
  })

  await batch.commit()
  console.log("Dados de exemplo adicionados com sucesso!")
}

// Botão para inicializar o banco de dados
document.addEventListener("DOMContentLoaded", () => {
  // Verificar se estamos na página principal e logados
  firebase.auth().onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes("index.html")) {
      // Criar botão de inicialização
      const header = document.querySelector(".header")
      if (header) {
        const seedButton = document.createElement("button")
        seedButton.textContent = "Inicializar Dados"
        seedButton.className = "btn btn-secondary"
        seedButton.style.marginLeft = "1rem"
        seedButton.addEventListener("click", seedDatabase)

        // Adicionar ao header
        const logo = header.querySelector(".logo")
        if (logo) {
          logo.appendChild(seedButton)
        }
      }
    }
  })
})

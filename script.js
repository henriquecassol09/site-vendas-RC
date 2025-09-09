
class RCVendasSystem {
  constructor() {
    this.produtos = []
    this.entradas = []
    this.saidas = []
    this.vendas = []
    this.currentUser = null
    this.editingProductId = null

    // Verificar autenticação
    this.checkAuth()
  }

  checkAuth() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user
        this.showMainSystem()
        this.init()
      } else {
        this.showLoginScreen()
      }
    })
  }

  showLoginScreen() {
    document.getElementById("loginScreen").style.display = "flex"
    document.getElementById("mainSystem").style.display = "none"
    this.setupLoginListeners()
  }

  showMainSystem() {
    document.getElementById("loginScreen").style.display = "none"
    document.getElementById("mainSystem").style.display = "flex"

    // Mostrar email do usuário
    const userEmailElement = document.getElementById("userEmail")
    if (userEmailElement && this.currentUser) {
      userEmailElement.textContent = this.currentUser.email
    }
  }

  setupLoginListeners() {
    // Login
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value
      const errorElement = document.getElementById("loginError")
      const loginBtn = document.querySelector(".login-btn")
      const loginBtnText = document.getElementById("loginBtnText")
      const loginLoader = document.getElementById("loginLoader")

      // Mostrar loading
      loginBtn.disabled = true
      loginBtnText.style.display = "none"
      loginLoader.style.display = "block"
      errorElement.style.display = "none"

      try {
        await auth.signInWithEmailAndPassword(email, password)
        // O sistema será redirecionado automaticamente pelo onAuthStateChanged
      } catch (error) {
        errorElement.style.display = "block"
        console.error("Erro de login:", error)
      } finally {
        // Esconder loading
        loginBtn.disabled = false
        loginBtnText.style.display = "block"
        loginLoader.style.display = "none"
      }
    })

    // Esqueceu a senha
    document.getElementById("forgotPassword").addEventListener("click", async (e) => {
      e.preventDefault()

      const email = document.getElementById("loginEmail").value

      if (!email) {
        alert("Por favor, digite seu email para recuperar a senha.")
        return
      }

      try {
        await auth.sendPasswordResetEmail(email)
        alert("Email de recuperação enviado. Verifique sua caixa de entrada.")
      } catch (error) {
        alert("Erro ao enviar email de recuperação: " + error.message)
      }
    })

    // Criar conta
    document.getElementById("createAccount").addEventListener("click", async (e) => {
      e.preventDefault()

      const email = prompt("Digite seu email:")
      if (!email) return

      const password = prompt("Digite sua senha (mínimo 6 caracteres):")
      if (!password || password.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.")
        return
      }

      try {
        await auth.createUserWithEmailAndPassword(email, password)
        alert("Conta criada com sucesso! Você será redirecionado para o sistema.")
      } catch (error) {
        alert("Erro ao criar conta: " + error.message)
      }
    })
  }

  async init() {
    this.updateDateTime()
    this.setupEventListeners()

    try {
      await this.loadAllData()
      this.loadDashboard()
      this.loadTables()
      this.checkIfNeedsSeedData()
    } catch (error) {
      console.error("Erro ao inicializar sistema:", error)
      alert("Erro ao carregar dados. Verifique sua conexão com a internet.")
    }

    // Atualizar data/hora a cada minuto
    setInterval(() => this.updateDateTime(), 60000)
  }

  async checkIfNeedsSeedData() {
    if (this.produtos.length === 0) {
      document.getElementById("seedDataBtn").style.display = "inline-flex"
    }
  }

  async loadAllData() {
    await Promise.all([this.loadProdutos(), this.loadEntradas(), this.loadSaidas(), this.loadVendasData()])
  }

  async loadProdutos() {
    try {
      const snapshot = await db.collection("produtos").get()
      this.produtos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      throw error
    }
  }

  async loadEntradas() {
    try {
      const snapshot = await db.collection("entradas").orderBy("data", "desc").get()
      this.entradas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Erro ao carregar entradas:", error)
      throw error
    }
  }

  async loadSaidas() {
    try {
      const snapshot = await db.collection("saidas").orderBy("data", "desc").get()
      this.saidas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Erro ao carregar saídas:", error)
      throw error
    }
  }

  async loadVendasData() {
    try {
      const snapshot = await db.collection("vendas").orderBy("data", "desc").get()
      this.vendas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
      throw error
    }
  }

  updateDateTime() {
    const now = new Date()
    const dateTimeElement = document.getElementById("dateTime")
    if (dateTimeElement) {
      dateTimeElement.textContent = now.toLocaleString("pt-BR")
    }
  }

  setupEventListeners() {
    // Navegação
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const section = e.target.closest(".nav-link").dataset.section
        this.showSection(section)
      })
    })

    // Formulários
    document.getElementById("formProduto").addEventListener("submit", (e) => {
      e.preventDefault()
      if (this.editingProductId) {
        this.updateProduto()
      } else {
        this.addProduto()
      }
    })

    document.getElementById("formEntrada").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addEntrada()
    })

    document.getElementById("formSaida").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addSaida()
    })

    document.getElementById("formVenda").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addVenda()
    })

    // Filtros
    document.getElementById("searchProduto").addEventListener("input", () => {
      this.filterEstoque()
    })

    document.getElementById("filterCategoria").addEventListener("change", () => {
      this.filterEstoque()
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Seed data
    document.getElementById("seedDataBtn").addEventListener("click", () => {
      this.seedDatabase()
    })

    // Modais - fechar ao clicar fora
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none"
        this.resetProductForm()
      }
    })
  }

  async logout() {
    try {
      await auth.signOut()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      alert("Erro ao fazer logout. Tente novamente.")
    }
  }

  showSection(sectionName) {
    // Remover classe active de todas as seções
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active")
    })

    // Remover classe active de todos os links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })

    // Adicionar classe active na seção e link correspondentes
    document.getElementById(sectionName).classList.add("active")
    document.querySelector(`[data-section="${sectionName}"]`).classList.add("active")

    // Carregar dados específicos da seção
    switch (sectionName) {
      case "dashboard":
        this.loadDashboard()
        break
      case "estoque":
        this.loadEstoque()
        break
      case "entrada":
        this.loadEntradas()
        break
      case "saida":
        this.loadSaidas()
        break
      case "vendas":
        this.loadVendas()
        break
      case "relatorios":
        this.loadRelatorios()
        break
    }
  }

  // Gestão de Produtos
  async addProduto() {
    const codigo = document.getElementById("codigoProduto").value
    const nome = document.getElementById("nomeProduto").value
    const categoria = document.getElementById("categoriaProduto").value
    const quantidade = Number.parseInt(document.getElementById("quantidadeProduto").value)
    const preco = Number.parseFloat(document.getElementById("precoProduto").value)
    const estoqueMinimo = Number.parseInt(document.getElementById("estoqueMinimo").value)

    // Verificar se código já existe
    if (this.produtos.find((p) => p.codigo === codigo)) {
      alert("Código do produto já existe!")
      return
    }

    const produto = {
      codigo,
      nome,
      categoria,
      quantidade,
      preco,
      estoqueMinimo,
      dataCadastro: new Date().toISOString(),
    }

    const btnSalvar = document.getElementById("btnSalvarProduto")
    const originalText = btnSalvar.innerHTML

    try {
      btnSalvar.disabled = true
      btnSalvar.innerHTML = '<div class="loading"></div> Salvando...'

      // Adicionar ao Firestore
      const docRef = await db.collection("produtos").add(produto)
      produto.id = docRef.id

      this.produtos.push(produto)
      this.loadEstoque()
      this.loadDashboard()
      this.closeModal("modalProduto")
      this.resetProductForm()

      alert("Produto cadastrado com sucesso!")
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      alert("Erro ao adicionar produto. Verifique sua conexão com a internet.")
    } finally {
      btnSalvar.disabled = false
      btnSalvar.innerHTML = originalText
    }
  }

  async updateProduto() {
    const codigo = document.getElementById("codigoProduto").value
    const nome = document.getElementById("nomeProduto").value
    const categoria = document.getElementById("categoriaProduto").value
    const quantidade = Number.parseInt(document.getElementById("quantidadeProduto").value)
    const preco = Number.parseFloat(document.getElementById("precoProduto").value)
    const estoqueMinimo = Number.parseInt(document.getElementById("estoqueMinimo").value)

    // Verificar se código já existe em outro produto
    const existingProduct = this.produtos.find((p) => p.codigo === codigo && p.id !== this.editingProductId)
    if (existingProduct) {
      alert("Código do produto já existe em outro produto!")
      return
    }

    const updatedProduto = {
      codigo,
      nome,
      categoria,
      quantidade,
      preco,
      estoqueMinimo,
    }

    const btnSalvar = document.getElementById("btnSalvarProduto")
    const originalText = btnSalvar.innerHTML

    try {
      btnSalvar.disabled = true
      btnSalvar.innerHTML = '<div class="loading"></div> Atualizando...'

      // Atualizar no Firestore
      await db.collection("produtos").doc(this.editingProductId).update(updatedProduto)

      // Atualizar na lista local
      const index = this.produtos.findIndex((p) => p.id === this.editingProductId)
      if (index !== -1) {
        this.produtos[index] = { ...this.produtos[index], ...updatedProduto }
      }

      this.loadEstoque()
      this.loadDashboard()
      this.closeModal("modalProduto")
      this.resetProductForm()

      alert("Produto atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      alert("Erro ao atualizar produto. Verifique sua conexão com a internet.")
    } finally {
      btnSalvar.disabled = false
      btnSalvar.innerHTML = originalText
    }
  }

  editProduto(id) {
    const produto = this.produtos.find((p) => p.id === id)
    if (!produto) return

    this.editingProductId = id

    document.getElementById("codigoProduto").value = produto.codigo
    document.getElementById("nomeProduto").value = produto.nome
    document.getElementById("categoriaProduto").value = produto.categoria
    document.getElementById("quantidadeProduto").value = produto.quantidade
    document.getElementById("precoProduto").value = produto.preco
    document.getElementById("estoqueMinimo").value = produto.estoqueMinimo

    document.getElementById("modalProdutoTitle").textContent = "Editar Produto"
    document.getElementById("btnSalvarProduto").textContent = "Atualizar"

    this.openModal("modalProduto")
  }

  async deleteProduto(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return

    try {
      // Excluir do Firestore
      await db.collection("produtos").doc(id).delete()

      // Excluir da lista local
      this.produtos = this.produtos.filter((p) => p.id !== id)

      this.loadEstoque()
      this.loadDashboard()
      alert("Produto excluído com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      alert("Erro ao excluir produto. Verifique sua conexão com a internet.")
    }
  }

  resetProductForm() {
    this.editingProductId = null
    document.getElementById("formProduto").reset()
    document.getElementById("modalProdutoTitle").textContent = "Cadastrar Produto"
    document.getElementById("btnSalvarProduto").textContent = "Salvar"
  }

  // Gestão de Entradas
  async addEntrada() {
    const notaFiscal = document.getElementById("notaFiscal").value
    const fornecedor = document.getElementById("fornecedor").value
    const produtoId = document.getElementById("produtoEntrada").value
    const quantidade = Number.parseInt(document.getElementById("quantidadeEntrada").value)
    const valor = Number.parseFloat(document.getElementById("valorEntrada").value)

    const produto = this.produtos.find((p) => p.id === produtoId)
    if (!produto) {
      alert("Produto não encontrado!")
      return
    }

    const entrada = {
      data: new Date().toISOString(),
      notaFiscal,
      fornecedor,
      produtoId,
      produtoNome: produto.nome,
      quantidade,
      valorUnitario: valor,
      valorTotal: quantidade * valor,
    }

    try {
      // Usar transação para garantir consistência
      await db.runTransaction(async (transaction) => {
        // Adicionar entrada
        const entradaRef = db.collection("entradas").doc()
        transaction.set(entradaRef, entrada)

        // Atualizar estoque
        const produtoRef = db.collection("produtos").doc(produtoId)
        transaction.update(produtoRef, {
          quantidade: firebase.firestore.FieldValue.increment(quantidade),
        })
      })

      // Atualizar dados locais
      entrada.id = Date.now().toString() // ID temporário
      this.entradas.unshift(entrada)
      produto.quantidade += quantidade

      this.loadEntradas()
      this.loadEstoque()
      this.loadDashboard()
      this.closeModal("modalEntrada")
      document.getElementById("formEntrada").reset()

      alert("Entrada registrada com sucesso!")
    } catch (error) {
      console.error("Erro ao registrar entrada:", error)
      alert("Erro ao registrar entrada. Verifique sua conexão com a internet.")
    }
  }

  // Gestão de Saídas
  async addSaida() {
    const cliente = document.getElementById("clienteSaida").value
    const produtoId = document.getElementById("produtoSaida").value
    const quantidade = Number.parseInt(document.getElementById("quantidadeSaida").value)
    const tipo = document.getElementById("tipoSaida").value

    const produto = this.produtos.find((p) => p.id === produtoId)
    if (!produto) {
      alert("Produto não encontrado!")
      return
    }

    if (produto.quantidade < quantidade) {
      alert("Quantidade insuficiente em estoque!")
      return
    }

    const saida = {
      data: new Date().toISOString(),
      cliente,
      produtoId,
      produtoNome: produto.nome,
      quantidade,
      valorUnitario: produto.preco,
      valorTotal: quantidade * produto.preco,
      tipo,
    }

    try {
      // Usar transação para garantir consistência
      await db.runTransaction(async (transaction) => {
        // Adicionar saída
        const saidaRef = db.collection("saidas").doc()
        transaction.set(saidaRef, saida)

        // Atualizar estoque
        const produtoRef = db.collection("produtos").doc(produtoId)
        transaction.update(produtoRef, {
          quantidade: firebase.firestore.FieldValue.increment(-quantidade),
        })
      })

      // Atualizar dados locais
      saida.id = Date.now().toString() // ID temporário
      this.saidas.unshift(saida)
      produto.quantidade -= quantidade

      this.loadSaidas()
      this.loadEstoque()
      this.loadDashboard()
      this.closeModal("modalSaida")
      document.getElementById("formSaida").reset()

      alert("Saída registrada com sucesso!")
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
      alert("Erro ao registrar saída. Verifique sua conexão com a internet.")
    }
  }

  // Gestão de Vendas
  async addVenda() {
    const cliente = document.getElementById("clienteVenda").value
    const produtoId = document.getElementById("produtoVenda").value
    const quantidade = Number.parseInt(document.getElementById("quantidadeVenda").value)
    const desconto = Number.parseFloat(document.getElementById("descontoVenda").value) || 0

    const produto = this.produtos.find((p) => p.id === produtoId)
    if (!produto) {
      alert("Produto não encontrado!")
      return
    }

    if (produto.quantidade < quantidade) {
      alert("Quantidade insuficiente em estoque!")
      return
    }

    const valorUnitario = produto.preco
    const valorBruto = quantidade * valorUnitario
    const valorDesconto = valorBruto * (desconto / 100)
    const valorTotal = valorBruto - valorDesconto

    const venda = {
      data: new Date().toISOString(),
      cliente,
      produtos: [
        {
          id: produtoId,
          nome: produto.nome,
          quantidade,
          valorUnitario,
          valorTotal: quantidade * valorUnitario,
        },
      ],
      quantidadeTotal: quantidade,
      valorBruto,
      desconto,
      valorDesconto,
      valorTotal,
      status: "Concluída",
    }

    const saida = {
      data: new Date().toISOString(),
      cliente,
      produtoId,
      produtoNome: produto.nome,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      tipo: "Venda",
    }

    try {
      // Usar transação para garantir consistência
      await db.runTransaction(async (transaction) => {
        // Adicionar venda
        const vendaRef = db.collection("vendas").doc()
        transaction.set(vendaRef, venda)

        // Adicionar saída
        const saidaRef = db.collection("saidas").doc()
        transaction.set(saidaRef, saida)

        // Atualizar estoque
        const produtoRef = db.collection("produtos").doc(produtoId)
        transaction.update(produtoRef, {
          quantidade: firebase.firestore.FieldValue.increment(-quantidade),
        })
      })

      // Atualizar dados locais
      venda.id = Date.now().toString() // ID temporário
      saida.id = (Date.now() + 1).toString() // ID temporário
      this.vendas.unshift(venda)
      this.saidas.unshift(saida)
      produto.quantidade -= quantidade

      this.loadVendas()
      this.loadSaidas()
      this.loadEstoque()
      this.loadDashboard()
      this.closeModal("modalVenda")
      document.getElementById("formVenda").reset()

      alert("Venda realizada com sucesso!")
    } catch (error) {
      console.error("Erro ao registrar venda:", error)
      alert("Erro ao registrar venda. Verifique sua conexão com a internet.")
    }
  }

  // Carregamento de Dados
  loadDashboard() {
    // Total de produtos
    document.getElementById("totalProdutos").textContent = this.produtos.length

    // Entradas hoje
    const hoje = new Date().toDateString()
    const entradasHoje = this.entradas.filter((e) => new Date(e.data).toDateString() === hoje).length
    document.getElementById("entradasHoje").textContent = entradasHoje

    // Saídas hoje
    const saidasHoje = this.saidas.filter((s) => new Date(s.data).toDateString() === hoje).length
    document.getElementById("saidasHoje").textContent = saidasHoje

    // Vendas do mês
    const mesAtual = new Date().getMonth()
    const anoAtual = new Date().getFullYear()
    const vendasMes = this.vendas
      .filter((v) => {
        const dataVenda = new Date(v.data)
        return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual
      })
      .reduce((total, venda) => total + venda.valorTotal, 0)

    document.getElementById("vendasMes").textContent = this.formatCurrency(vendasMes)

    // Produtos com estoque baixo
    this.loadEstoqueBaixo()
  }

  loadEstoqueBaixo() {
    const container = document.getElementById("estoqueBaixo")
    const produtosBaixo = this.produtos.filter((p) => p.quantidade <= p.estoqueMinimo)

    if (produtosBaixo.length === 0) {
      container.innerHTML = "<p>Nenhum produto com estoque baixo.</p>"
      return
    }

    container.innerHTML = produtosBaixo
      .map((produto) => {
        const isCritical = produto.quantidade === 0
        return `
        <div class="low-stock-item ${isCritical ? "critical" : ""}">
          <div>
            <strong>${produto.nome}</strong> (${produto.codigo})
            <br><small>Categoria: ${produto.categoria}</small>
          </div>
          <div>
            <span class="status-badge ${isCritical ? "status-danger" : "status-warning"}">
              ${produto.quantidade} unidades
            </span>
          </div>
        </div>
      `
      })
      .join("")
  }

  loadEstoque() {
    const tbody = document.getElementById("tabelaEstoque")
    tbody.innerHTML = this.produtos
      .map(
        (produto) => `
      <tr>
        <td>${produto.codigo}</td>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>
          <span class="status-badge ${
            produto.quantidade <= produto.estoqueMinimo
              ? produto.quantidade === 0
                ? "status-danger"
                : "status-warning"
              : "status-success"
          }">
            ${produto.quantidade}
          </span>
        </td>
        <td>${this.formatCurrency(produto.preco)}</td>
        <td>${this.formatCurrency(produto.quantidade * produto.preco)}</td>
        <td>
          <button class="btn btn-edit" onclick="system.editProduto('${produto.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger" onclick="system.deleteProduto('${produto.id}')" style="margin-left: 0.5rem;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("")

    this.updateProdutoSelects()
  }

  loadEntradas() {
    const tbody = document.getElementById("tabelaEntrada")
    tbody.innerHTML = this.entradas
      .map(
        (entrada) => `
      <tr>
        <td>${this.formatDate(entrada.data)}</td>
        <td>${entrada.notaFiscal}</td>
        <td>${entrada.fornecedor}</td>
        <td>${entrada.produtoNome}</td>
        <td>${entrada.quantidade}</td>
        <td>${this.formatCurrency(entrada.valorUnitario)}</td>
        <td>${this.formatCurrency(entrada.valorTotal)}</td>
      </tr>
    `,
      )
      .join("")
  }

  loadSaidas() {
    const tbody = document.getElementById("tabelaSaida")
    tbody.innerHTML = this.saidas
      .map(
        (saida) => `
      <tr>
        <td>${this.formatDate(saida.data)}</td>
        <td>${saida.cliente}</td>
        <td>${saida.produtoNome}</td>
        <td>${saida.quantidade}</td>
        <td>${this.formatCurrency(saida.valorUnitario)}</td>
        <td>${this.formatCurrency(saida.valorTotal)}</td>
        <td>
          <span class="status-badge ${saida.tipo === "Venda" ? "status-success" : "status-warning"}">
            ${saida.tipo}
          </span>
        </td>
      </tr>
    `,
      )
      .join("")
  }

  loadVendas() {
    const tbody = document.getElementById("tabelaVendas")
    tbody.innerHTML = this.vendas
      .map(
        (venda) => `
      <tr>
        <td>${this.formatDate(venda.data)}</td>
        <td>${venda.cliente}</td>
        <td>${venda.produtos.map((p) => p.nome).join(", ")}</td>
        <td>${venda.quantidadeTotal}</td>
        <td>${this.formatCurrency(venda.valorTotal)}</td>
        <td>
          <span class="status-badge status-success">
            ${venda.status}
          </span>
        </td>
      </tr>
    `,
      )
      .join("")
  }

  loadRelatorios() {
    // Configurar ano atual
    const currentYear = new Date().getFullYear()
    document.getElementById("reportYear").value = currentYear
  }

  // Filtros
  filterEstoque() {
    const searchTerm = document.getElementById("searchProduto").value.toLowerCase()
    const categoria = document.getElementById("filterCategoria").value

    let produtosFiltrados = this.produtos

    if (searchTerm) {
      produtosFiltrados = produtosFiltrados.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(searchTerm) || produto.codigo.toLowerCase().includes(searchTerm),
      )
    }

    if (categoria) {
      produtosFiltrados = produtosFiltrados.filter((produto) => produto.categoria === categoria)
    }

    const tbody = document.getElementById("tabelaEstoque")
    tbody.innerHTML = produtosFiltrados
      .map(
        (produto) => `
      <tr>
        <td>${produto.codigo}</td>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>
          <span class="status-badge ${
            produto.quantidade <= produto.estoqueMinimo
              ? produto.quantidade === 0
                ? "status-danger"
                : "status-warning"
              : "status-success"
          }">
            ${produto.quantidade}
          </span>
        </td>
        <td>${this.formatCurrency(produto.preco)}</td>
        <td>${this.formatCurrency(produto.quantidade * produto.preco)}</td>
        <td>
          <button class="btn btn-edit" onclick="system.editProduto('${produto.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger" onclick="system.deleteProduto('${produto.id}')" style="margin-left: 0.5rem;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("")
  }

  // Relatórios
  generateReport() {
    const month = document.getElementById("reportMonth").value
    const year = Number.parseInt(document.getElementById("reportYear").value)

    if (!month || !year) {
      alert("Selecione o mês e ano para gerar o relatório")
      return
    }

    this.generateSalesReport(month, year)
    this.generateEntradasReport(month, year)
    this.generateSaidasReport(month, year)
  }

  generateSalesReport(month, year) {
    const vendasPeriodo = this.vendas.filter((venda) => {
      const dataVenda = new Date(venda.data)
      return dataVenda.getMonth() === Number.parseInt(month) - 1 && dataVenda.getFullYear() === year
    })

    const container = document.getElementById("relatorioVendas")

    if (vendasPeriodo.length === 0) {
      container.innerHTML = "<p>Nenhuma venda encontrada no período selecionado.</p>"
      return
    }

    const totalVendas = vendasPeriodo.reduce((total, venda) => total + venda.valorTotal, 0)
    const quantidadeVendas = vendasPeriodo.length

    container.innerHTML = `
      <div class="report-item">
        <span>Número de Vendas:</span>
        <span>${quantidadeVendas}</span>
      </div>
      <div class="report-item">
        <span>Valor Total:</span>
        <span>${this.formatCurrency(totalVendas)}</span>
      </div>
      <div class="report-item">
        <span>Ticket Médio:</span>
        <span>${this.formatCurrency(totalVendas / quantidadeVendas)}</span>
      </div>
      <div class="report-total">
        Total do Período: ${this.formatCurrency(totalVendas)}
      </div>
    `
  }

  generateEntradasReport(month, year) {
    const entradasPeriodo = this.entradas.filter((entrada) => {
      const dataEntrada = new Date(entrada.data)
      return dataEntrada.getMonth() === Number.parseInt(month) - 1 && dataEntrada.getFullYear() === year
    })

    const container = document.getElementById("relatorioEntradas")

    if (entradasPeriodo.length === 0) {
      container.innerHTML = "<p>Nenhuma entrada encontrada no período selecionado.</p>"
      return
    }

    const totalEntradas = entradasPeriodo.reduce((total, entrada) => total + entrada.valorTotal, 0)
    const quantidadeEntradas = entradasPeriodo.length

    container.innerHTML = `
      <div class="report-item">
        <span>Número de Entradas:</span>
        <span>${quantidadeEntradas}</span>
      </div>
      <div class="report-item">
        <span>Valor Total:</span>
        <span>${this.formatCurrency(totalEntradas)}</span>
      </div>
      <div class="report-item">
        <span>Valor Médio por Entrada:</span>
        <span>${this.formatCurrency(totalEntradas / quantidadeEntradas)}</span>
      </div>
      <div class="report-total">
        Total Investido: ${this.formatCurrency(totalEntradas)}
      </div>
    `
  }

  generateSaidasReport(month, year) {
    const saidasPeriodo = this.saidas.filter((saida) => {
      const dataSaida = new Date(saida.data)
      return dataSaida.getMonth() === Number.parseInt(month) - 1 && dataSaida.getFullYear() === year
    })

    const container = document.getElementById("relatorioSaidas")

    if (saidasPeriodo.length === 0) {
      container.innerHTML = "<p>Nenhuma saída encontrada no período selecionado.</p>"
      return
    }

    const totalSaidas = saidasPeriodo.reduce((total, saida) => total + saida.valorTotal, 0)
    const quantidadeSaidas = saidasPeriodo.length

    // Agrupar por tipo
    const saidasPorTipo = saidasPeriodo.reduce((acc, saida) => {
      acc[saida.tipo] = (acc[saida.tipo] || 0) + saida.valorTotal
      return acc
    }, {})

    const tiposHtml = Object.entries(saidasPorTipo)
      .map(
        ([tipo, valor]) => `
      <div class="report-item">
        <span>${tipo}:</span>
        <span>${this.formatCurrency(valor)}</span>
      </div>
    `,
      )
      .join("")

    container.innerHTML = `
      <div class="report-item">
        <span>Número de Saídas:</span>
        <span>${quantidadeSaidas}</span>
      </div>
      ${tiposHtml}
      <div class="report-total">
        Total das Saídas: ${this.formatCurrency(totalSaidas)}
      </div>
    `
  }

  // Seed Database
  async seedDatabase() {
    if (!confirm("Isso irá adicionar produtos de exemplo ao sistema. Continuar?")) return

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
      {
        codigo: "EL001",
        nome: "Bateria 60Ah",
        categoria: "Elétrica",
        quantidade: 15,
        preco: 180.0,
        estoqueMinimo: 5,
        dataCadastro: new Date().toISOString(),
      },
      {
        codigo: "CA001",
        nome: "Farol Dianteiro",
        categoria: "Carroceria",
        quantidade: 12,
        preco: 120.0,
        estoqueMinimo: 4,
        dataCadastro: new Date().toISOString(),
      },
    ]

    const seedBtn = document.getElementById("seedDataBtn")
    const originalText = seedBtn.innerHTML

    try {
      seedBtn.disabled = true
      seedBtn.innerHTML = '<div class="loading"></div> Inicializando...'

      // Adicionar produtos em lote
      const batch = db.batch()
      produtosExemplo.forEach((produto) => {
        const produtoRef = db.collection("produtos").doc()
        batch.set(produtoRef, produto)
      })

      await batch.commit()

      // Recarregar dados
      await this.loadAllData()
      this.loadDashboard()
      this.loadTables()

      seedBtn.style.display = "none"
      alert("Dados de exemplo adicionados com sucesso!")
    } catch (error) {
      console.error("Erro ao inicializar dados:", error)
      alert("Erro ao inicializar dados. Verifique sua conexão com a internet.")
    } finally {
      seedBtn.disabled = false
      seedBtn.innerHTML = originalText
    }
  }

  // Utilitários
  updateProdutoSelects() {
    const selects = ["produtoEntrada", "produtoSaida", "produtoVenda"]

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      if (select) {
        select.innerHTML =
          '<option value="">Selecione o produto</option>' +
          this.produtos
            .map(
              (produto) =>
                `<option value="${produto.id}">${produto.nome} (${produto.codigo}) - Estoque: ${produto.quantidade}</option>`,
            )
            .join("")
      }
    })
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  loadTables() {
    this.loadEstoque()
    this.loadEntradas()
    this.loadSaidas()
    this.loadVendas()
  }

  // Gestão de Modais
  openModal(modalId) {
    document.getElementById(modalId).style.display = "block"

    // Atualizar selects de produtos quando abrir modais
    if (["modalEntrada", "modalSaida", "modalVenda"].includes(modalId)) {
      this.updateProdutoSelects()
    }
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = "none"
    if (modalId === "modalProduto") {
      this.resetProductForm()
    }
  }
}

// Funções globais para os modais
function openModal(modalId) {
  system.openModal(modalId)
}

function closeModal(modalId) {
  system.closeModal(modalId)
}

function generateReport() {
  system.generateReport()
}

// Inicializar sistema
const system = new RevizzeCarSystem()

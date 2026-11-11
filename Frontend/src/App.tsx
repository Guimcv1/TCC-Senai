import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react'
import { api, type Addon, type Category, type Customer, type Ingredient, type Order, type Product, type Supplier } from './api'
import './App.css'

type Page = 'Visão geral' | 'Pedidos' | 'Cardápio' | 'Clientes' | 'Estoque' | 'Fornecedores' | 'Entregas' | 'Relatórios' | 'Configurações'
const pages: Page[] = ['Visão geral', 'Pedidos', 'Cardápio', 'Clientes', 'Estoque', 'Fornecedores', 'Entregas', 'Relatórios', 'Configurações']

function money(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function decimalValue(value: string) {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '')
  if (cleaned.includes(',')) return cleaned.replace(/\./g, '').replace(',', '.')
  return cleaned
}

function quantityLabel(value: string | number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return String(value)
  return parsed.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

type RecipeEntry = { ingredientId: number; quantity: string }

function RecipeEditor({ ingredients, recipe, onChange }: { ingredients: Ingredient[]; recipe: RecipeEntry[]; onChange: (recipe: RecipeEntry[]) => void }) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState('')
  const available = ingredients.filter((ingredient) => !recipe.some((entry) => entry.ingredientId === ingredient.id))
  const addIngredient = () => {
    if (selectedId !== '' && Number(quantity) > 0) {
      onChange([...recipe, { ingredientId: selectedId, quantity: decimalValue(quantity) }])
      setSelectedId('')
      setQuantity('')
    }
  }
  return <fieldset className="recipe-fieldset"><legend>Ingredientes por unidade</legend><div className="recipe-add-row"><select value={selectedId} onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : '')}><option value="">Selecione um ingrediente</option>{available.map((ingredient) => <option value={ingredient.id} key={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}</select><input min="0" step="0.001" inputMode="decimal" placeholder="Quantidade" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><button type="button" className="secondary-button" disabled={selectedId === '' || Number(quantity) <= 0} onClick={addIngredient}>Adicionar</button></div>{recipe.length ? <div className="recipe-list">{recipe.map((entry) => { const ingredient = ingredients.find((item) => item.id === entry.ingredientId); return <div className="recipe-item" key={entry.ingredientId}><span>{ingredient?.name ?? `Ingrediente #${entry.ingredientId}`} ({ingredient?.unit ?? 'un'})</span><strong>{quantityLabel(entry.quantity)}</strong><button type="button" className="recipe-remove" title="Remover ingrediente" onClick={() => onChange(recipe.filter((item) => item.ingredientId !== entry.ingredientId))}>−</button></div> })}</div> : <p className="form-hint">Selecione um ingrediente e informe a quantidade para adicioná-lo.</p>}</fieldset>
}

function App() {
  const [page, setPage] = useState<Page>('Visão geral')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showOrder, setShowOrder] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextOrders, nextProducts, nextCategories, nextCustomers, nextIngredients, nextSuppliers, nextAddons] = await Promise.all([
        api.orders(), api.products(), api.categories(), api.customers(), api.ingredients(), api.suppliers(), api.addons(),
      ])
      setOrders(nextOrders); setProducts(nextProducts); setCategories(nextCategories)
      setCustomers(nextCustomers); setIngredients(nextIngredients); setSuppliers(nextSuppliers); setAddons(nextAddons)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados da API.')
    } finally { setLoading(false) }
  }, [])

  // The initial request synchronizes the screen with the API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadData() }, [loadData])

  const navigate = (nextPage: Page) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">S</div><div><strong>Lanchonete</strong><span>Gestão da lanchonete</span></div></div>
        <nav className="main-nav"><p className="nav-label">MENU PRINCIPAL</p>{pages.slice(0, 6).map((item) => <NavItem key={item} page={item} active={page} onClick={navigate} count={item === 'Pedidos' ? orders.length : undefined} />)}<p className="nav-label space-label">OPERAÇÃO</p>{pages.slice(6).map((item) => <NavItem key={item} page={item} active={page} onClick={navigate} />)}</nav>
        <div className="sidebar-bottom"><div className="profile"><div className="avatar">AD</div><div><strong>Administrador</strong><small>Lanchonete</small></div></div></div>
      </aside>
      <main className="content">
        <header className="topbar"><div className="breadcrumb"><span>Início</span><b>/</b><strong>{page}</strong></div><button className="refresh-button" onClick={() => void loadData()}>↻ Atualizar</button></header>
        {error && <div className="api-error"><strong>Não foi possível acessar a API.</strong><span>{error}</span><button onClick={() => void loadData()}>Tentar novamente</button></div>}
        {loading ? <div className="empty-state"><strong>Carregando dados da API...</strong></div> : <PageContent page={page} orders={orders} products={products} categories={categories} customers={customers} ingredients={ingredients} suppliers={suppliers} navigate={navigate} onCreated={loadData} onNewOrder={() => setShowOrder(true)} />}
      </main>
      {showOrder && <OrderModal products={products} customers={customers} addons={addons} onClose={() => setShowOrder(false)} onCreated={async () => { setShowOrder(false); await loadData() }} />}
    </div>
  )
}

function NavItem({ page, active, onClick, count }: { page: Page; active: Page; onClick: (page: Page) => void; count?: number }) {
  const icon: Record<Page, string> = { 'Visão geral': '⌂', Pedidos: '▤', Cardápio: '▦', Clientes: '♙', Estoque: '◫', Fornecedores: '▥', Entregas: '⌁', Relatórios: '▤', Configurações: '⚙' }
  return <button className={active === page ? 'nav-item active' : 'nav-item'} onClick={() => onClick(page)}><span className="nav-icon">{icon[page]}</span>{page}{count !== undefined && <b className="nav-count">{count}</b>}</button>
}

function PageContent(props: { page: Page; orders: Order[]; products: Product[]; categories: Category[]; customers: Customer[]; ingredients: Ingredient[]; suppliers: Supplier[]; navigate: (page: Page) => void; onCreated: () => Promise<void>; onNewOrder: () => void }) {
  const { page, orders, products, categories, customers, ingredients, suppliers, navigate, onCreated, onNewOrder } = props
  if (page === 'Visão geral') return <Overview {...props} />
  if (page === 'Pedidos') return <OrdersPage orders={orders} customers={customers} onNewOrder={onNewOrder} />
  if (page === 'Cardápio') return <MenuPage products={products} categories={categories} ingredients={ingredients} onCreated={onCreated} />
  if (page === 'Clientes') return <CustomersPage customers={customers} onCreated={onCreated} />
  if (page === 'Estoque') return <StockPage ingredients={ingredients} suppliers={suppliers} onCreated={onCreated} />
  if (page === 'Fornecedores') return <SuppliersPage suppliers={suppliers} onCreated={onCreated} />
  if (page === 'Entregas') return <DeliveriesPage orders={orders} customers={customers} />
  if (page === 'Relatórios') return <ReportsPage orders={orders} products={products} navigate={navigate} />
  return <SettingsPage />
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <section className="page-heading"><div><p className="eyebrow">LANCHONETE</p><h1>{title}</h1><p className="subheading">{subtitle}</p></div>{action}</section>
}

function Overview({ orders, products, categories, customers, navigate, onNewOrder }: Parameters<typeof PageContent>[0]) {
  const total = orders.reduce((sum, order) => sum + Number(order.total), 0)
  return <><Header title="Visão geral" subtitle="Dados carregados diretamente do sistema." action={<button className="primary-button" onClick={onNewOrder}>＋ Novo pedido</button>} /><section className="stats-grid"><StatCard label="Vendas registradas" value={money(total)} icon="↗" tone="orange" /><StatCard label="Pedidos registrados" value={String(orders.length)} icon="▤" tone="purple" /><StatCard label="Ticket médio" value={money(orders.length ? total / orders.length : 0)} icon="⌁" tone="blue" /><StatCard label="Clientes cadastrados" value={String(customers.length)} icon="♙" tone="green" /></section><section className="dashboard-grid"><div className="panel orders-panel"><PanelHeading title="Pedidos recentes" subtitle="Últimos registros da API" action={<button className="text-button" onClick={() => navigate('Pedidos')}>Ver todos →</button>} />{orders.length ? orders.slice(0, 5).map((order) => <OrderRow order={order} key={order.id} customers={customers} />) : <Empty text="Nenhum pedido cadastrado." />}</div><div className="panel summary-panel"><PanelHeading title="Cardápio" subtitle="Produtos disponíveis" action={<button className="text-button" onClick={() => navigate('Cardápio')}>Ver cardápio →</button>} /><div className="big-number">{products.length}<small> produtos em {categories.length} categorias</small></div>{products.length ? <div className="compact-list">{products.slice(0, 5).map((product) => <div key={product.id}><span>{product.name}</span><strong>{money(product.base_price)}</strong></div>)}</div> : <Empty text="Nenhum produto cadastrado." />}</div></section></>
}

function OrdersPage({ orders, customers, onNewOrder }: { orders: Order[]; customers: Customer[]; onNewOrder: () => void }) {
  const [version, setVersion] = useState(0)
  const reload = () => setVersion(version + 1)
  return <><Header title="Pedidos" subtitle="Pedidos registrados pela API." action={<button className="primary-button" onClick={onNewOrder}>＋ Novo pedido</button>} /><div className="panel table-panel">{orders.length ? orders.map((order) => <OrderRow order={order} key={`${order.id}-${version}`} customers={customers} onChanged={reload} />) : <Empty text="Nenhum pedido cadastrado. Crie o primeiro pedido." />}</div></>
}

function MenuPage({ products, categories, ingredients, onCreated }: { products: Product[]; categories: Category[]; ingredients: Ingredient[]; onCreated: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  return <><Header title="Cardápio" subtitle="Produtos e categorias cadastrados na API." action={<button className="primary-button" onClick={() => setShowForm(true)}>＋ Novo produto</button>} /><div className="panel"><PanelHeading title={`${products.length} produtos`} subtitle={`${categories.length} categorias cadastradas`} />{products.length ? <div className="data-grid">{products.map((product) => <div className="data-card" key={product.id}><div className="food-icon orange">🍔</div><div><strong>{product.name}</strong><small>{categories.find((category) => category.id === product.category_id)?.name ?? `Categoria #${product.category_id}`}</small><b>{money(product.base_price)}</b></div><RowActions onEdit={() => setEditing(product)} onDelete={async () => { if (window.confirm(`Remover ${product.name}?`)) { await api.deleteProduct(product.id); await onCreated() } }} /></div>)}</div> : <Empty text="Nenhum produto cadastrado." />}</div>{showForm && <ProductModal categories={categories} ingredients={ingredients} onClose={() => setShowForm(false)} onCreated={onCreated} />}{editing && <EditProductModal product={editing} categories={categories} ingredients={ingredients} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onCreated() }} />}</>
}

function CustomersPage({ customers, onCreated }: { customers: Customer[]; onCreated: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  return <><Header title="Clientes" subtitle="Cadastros reais de clientes." action={<button className="primary-button" onClick={() => setShowForm(true)}>＋ Novo cliente</button>} /><div className="panel table-panel">{customers.length ? customers.map((customer) => <div className="customer-row" key={customer.id}><div className="order-avatar orange">{customer.name.slice(0, 2).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.contact} {customer.address ? `· ${customer.address}` : ''}</span></div><small>ID #{customer.id}</small><RowActions onEdit={() => setEditing(customer)} onDelete={async () => { if (window.confirm(`Remover ${customer.name}?`)) { await api.deleteCustomer(customer.id); await onCreated() } }} /></div>) : <Empty text="Nenhum cliente cadastrado." />}</div>{showForm && <CustomerModal onClose={() => setShowForm(false)} onCreated={async () => { setShowForm(false); await onCreated() }} />}{editing && <CustomerEditModal customer={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onCreated() }} />}</>
}

function StockPage({ ingredients, suppliers, onCreated }: { ingredients: Ingredient[]; suppliers: Supplier[]; onCreated: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  return <><Header title="Estoque" subtitle="Ingredientes e quantidades armazenados." action={<button className="primary-button" onClick={() => setShowForm(true)}>＋ Novo ingrediente</button>} /><div className="panel table-panel">{ingredients.length ? ingredients.map((ingredient) => <div className="stock-row" key={ingredient.id}><div><strong>{ingredient.name}</strong><span>Fornecedor: {suppliers.find((supplier) => supplier.id === ingredient.supplier_id)?.name ?? `#${ingredient.supplier_id}`}</span></div><b>{quantityLabel(ingredient.stock_quantity)} {ingredient.unit}</b><RowActions onEdit={() => setEditing(ingredient)} onDelete={async () => { if (window.confirm(`Remover ${ingredient.name}?`)) { await api.deleteIngredient(ingredient.id); await onCreated() } }} /></div>) : <Empty text="Nenhum ingrediente cadastrado." />}</div>{showForm && <IngredientModal suppliers={suppliers} onClose={() => setShowForm(false)} onCreated={async () => { setShowForm(false); await onCreated() }} />}{editing && <IngredientEditModal ingredient={editing} suppliers={suppliers} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onCreated() }} />}</>
}

function SuppliersPage({ suppliers, onCreated }: { suppliers: Supplier[]; onCreated: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  return <><Header title="Fornecedores" subtitle="Fornecedores cadastrados na API." action={<button className="primary-button" onClick={() => setShowForm(true)}>＋ Novo fornecedor</button>} /><div className="panel table-panel">{suppliers.length ? suppliers.map((supplier) => <div className="customer-row" key={supplier.id}><div className="order-avatar blue">F</div><div><strong>{supplier.name}</strong><span>{supplier.contact || 'Contato não informado'}</span></div><small>ID #{supplier.id}</small><RowActions onEdit={() => setEditing(supplier)} onDelete={async () => { if (window.confirm(`Remover ${supplier.name}?`)) { await api.deleteSupplier(supplier.id); await onCreated() } }} /></div>) : <Empty text="Nenhum fornecedor cadastrado." />}</div>{showForm && <SupplierModal onClose={() => setShowForm(false)} onCreated={async () => { setShowForm(false); await onCreated() }} />}{editing && <SupplierEditModal supplier={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onCreated() }} />}</>
}

function DeliveriesPage({ orders, customers }: { orders: Order[]; customers: Customer[] }) {
  const deliveries = orders.filter((order) => order.delivery_type === 'delivery')
  return <><Header title="Entregas" subtitle="Pedidos marcados como delivery na API." /><div className="panel table-panel">{deliveries.length ? deliveries.map((order) => <OrderRow order={order} key={order.id} customers={customers} />) : <Empty text="Nenhuma entrega registrada." />}</div></>
}

function ReportsPage({ orders, products, navigate }: { orders: Order[]; products: Product[]; navigate: (page: Page) => void }) {
  const total = orders.reduce((sum, order) => sum + Number(order.total), 0)
  return <><Header title="Relatórios" subtitle="Indicadores calculados a partir dos registros da API." /><section className="stats-grid"><StatCard label="Receita total" value={money(total)} icon="↗" tone="orange" /><StatCard label="Pedidos" value={String(orders.length)} icon="▤" tone="purple" /><StatCard label="Produtos" value={String(products.length)} icon="▦" tone="blue" /><StatCard label="Delivery" value={String(orders.filter((order) => order.delivery_type === 'delivery').length)} icon="⌁" tone="green" /></section><div className="panel report-panel"><h2>Dados disponíveis</h2><p>Os relatórios detalhados dependem de pedidos e produtos cadastrados.</p><button className="text-button" onClick={() => navigate('Pedidos')}>Consultar pedidos →</button></div></>
}

function SettingsPage() {
  const [status, setStatus] = useState('Não verificado')
  return <><Header title="Configurações" subtitle="Configurações e diagnóstico da aplicação." /><div className="panel settings-card"><h2>Conexão com a API</h2><p>O frontend utiliza a variável <code>VITE_API_URL</code> ou, por padrão, http://localhost:8000/api.</p><button className="primary-button" onClick={async () => { try { const response = await api.health(); setStatus(response.status === 'ok' ? 'API online' : 'API respondeu com estado desconhecido') } catch { setStatus('API indisponível') } }}>Testar conexão</button><strong className={status === 'API online' ? 'online' : ''}>{status}</strong></div></>
}

function EditProductModal({ product, categories, ingredients, onClose, onSaved }: { product: Product; categories: Category[]; ingredients: Ingredient[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product.name); const [price, setPrice] = useState(product.base_price); const [categoryId, setCategoryId] = useState(product.category_id); const [recipe, setRecipe] = useState<RecipeEntry[]>(product.ingredients.map((item) => ({ ingredientId: item.ingredient_id, quantity: item.quantity }))); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.updateProduct(product.id, { name, base_price: decimalValue(price), category_id: categoryId, active: product.active, ingredients: recipe.map((item) => ({ ingredient_id: item.ingredientId, quantity: decimalValue(item.quantity) })) }); await onSaved() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao atualizar produto.') } }
  return <Modal title="Editar produto" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Preço (R$)<input required min="0" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label><label>Categoria<select required value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><RecipeEditor ingredients={ingredients} recipe={recipe} onChange={setRecipe} />{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar alterações</button></form></Modal>
}

function CustomerEditModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(customer.name); const [contact, setContact] = useState(customer.contact); const [address, setAddress] = useState(customer.address ?? ''); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.updateCustomer(customer.id, { name, contact, address: address || null }); await onSaved() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao atualizar cliente.') } }
  return <Modal title="Editar cliente" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Contato<input required value={contact} onChange={(event) => setContact(event.target.value)} /></label><label>Endereço<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar alterações</button></form></Modal>
}

function IngredientEditModal({ ingredient, suppliers, onClose, onSaved }: { ingredient: Ingredient; suppliers: Supplier[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(ingredient.name); const [quantity, setQuantity] = useState(quantityLabel(ingredient.stock_quantity)); const [supplierId, setSupplierId] = useState(ingredient.supplier_id); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.updateIngredient(ingredient.id, { name, stock_quantity: decimalValue(quantity), unit: ingredient.unit, supplier_id: supplierId }); await onSaved() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao atualizar ingrediente.') } }
  return <Modal title="Editar ingrediente" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Quantidade em estoque<input required min="0" step="0.001" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label>Unidade<input value={ingredient.unit} disabled /></label><label>Fornecedor<select required value={supplierId} onChange={(event) => setSupplierId(Number(event.target.value))}>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar alterações</button></form></Modal>
}

function SupplierEditModal({ supplier, onClose, onSaved }: { supplier: Supplier; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(supplier.name); const [contact, setContact] = useState(supplier.contact ?? ''); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.updateSupplier(supplier.id, { name, contact: contact || null }); await onSaved() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao atualizar fornecedor.') } }
  return <Modal title="Editar fornecedor" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Contato<input value={contact} onChange={(event) => setContact(event.target.value)} /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar alterações</button></form></Modal>
}

function OrderModal({ products, customers, addons, onClose, onCreated }: { products: Product[]; customers: Customer[]; addons: Addon[]; onClose: () => void; onCreated: () => Promise<void> }) {
  const [productId, setProductId] = useState(products[0]?.id ?? 0); const [customerId, setCustomerId] = useState<number | ''>(''); const [quantity, setQuantity] = useState(1); const [channel, setChannel] = useState('counter'); const [deliveryType, setDeliveryType] = useState('counter'); const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]); const [notes, setNotes] = useState(''); const [message, setMessage] = useState('')
  const selected = products.find((product) => product.id === productId)
  const selectedCustomer = customers.find((customer) => customer.id === customerId)
  const requiresCustomer = deliveryType !== 'counter'
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); if (requiresCustomer && !selectedCustomer) { setMessage('Selecione um cliente para pedidos que não são de balcão.'); return } if (deliveryType === 'delivery' && !selectedCustomer?.address) { setMessage('O cliente selecionado precisa ter endereço cadastrado para delivery.'); return } try { await api.createOrder({ channel, delivery_type: deliveryType, customer_id: customerId === '' ? null : customerId, items: [{ product_id: productId, quantity, addon_ids: selectedAddonIds, notes: notes.trim() || null }], payments: [], delivery: deliveryType === 'delivery' ? { address: selectedCustomer?.address, fee: 0 } : null }); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar pedido.') } }
  const total = selected ? (Number(selected.base_price) + selectedAddonIds.reduce((sum, id) => sum + Number(addons.find((addon) => addon.id === id)?.price ?? 0), 0)) * quantity : 0
  return <Modal title="Novo pedido" onClose={onClose}><form onSubmit={submit}><label>Cliente<select required={requiresCustomer} value={customerId} onChange={(event) => setCustomerId(event.target.value ? Number(event.target.value) : '')}><option value="">Não identificado</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Produto<select required value={productId} onChange={(event) => setProductId(Number(event.target.value))}>{products.map((product) => <option value={product.id} key={product.id}>{product.name} — {money(product.base_price)}</option>)}</select></label>{selected && selected.ingredients.length === 0 && <p className="form-error">Este produto não possui ingredientes. Edite o produto e cadastre a receita antes de criar o pedido.</p>}<label>Quantidade<input required min="1" type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>{addons.length > 0 && <fieldset className="order-options"><legend>Adicionais</legend>{addons.map((addon) => <label className="checkbox-option" key={addon.id}><input type="checkbox" checked={selectedAddonIds.includes(addon.id)} onChange={(event) => setSelectedAddonIds(event.target.checked ? [...selectedAddonIds, addon.id] : selectedAddonIds.filter((id) => id !== addon.id))} /><span>{addon.name}</span><b>+ {money(addon.price)}</b></label>)}</fieldset>}<label>Anotações do pedido<textarea rows={3} placeholder="Ex.: sem cebola, retirar tomate, ponto da carne..." value={notes} onChange={(event) => setNotes(event.target.value)} /></label><label>Canal<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="counter">Balcão</option><option value="phone">Telefone</option><option value="app">Aplicativo</option></select></label><label>Tipo<select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value)}><option value="counter">Balcão</option><option value="pickup">Retirada</option><option value="table">Mesa</option><option value="delivery">Delivery</option></select></label>{requiresCustomer && <label>Endereço cadastrado<input value={selectedCustomer?.address ?? ''} placeholder="Selecione um cliente" readOnly /></label>}<div className="modal-total"><span>Total estimado</span><strong>{money(total)}</strong></div>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button" disabled={!products.length || !selected?.ingredients.length}>Criar pedido</button></form></Modal>
}

function ProductModal({ categories, ingredients, onClose, onCreated }: { categories: Category[]; ingredients: Ingredient[]; onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0); const [categoryName, setCategoryName] = useState(''); const [showCategory, setShowCategory] = useState(!categories.length); const [message, setMessage] = useState(''); const [recipe, setRecipe] = useState<RecipeEntry[]>([])
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); try { await api.createProduct({ name, base_price: decimalValue(price), category_id: categoryId, active: true, ingredients: recipe.map((item) => ({ ingredient_id: item.ingredientId, quantity: decimalValue(item.quantity) })) }); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar produto.') } }
  const createCategory = async () => { setMessage(''); try { const category = await api.createCategory({ name: categoryName }); setCategoryId(category.id); setCategoryName(''); setShowCategory(false); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar categoria.') } }
  return <Modal title="Novo produto" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Preço (R$)<div className="currency-input"><span>R$</span><input required min="0" inputMode="decimal" placeholder="0,00" value={price} onChange={(event) => setPrice(event.target.value)} /></div></label><label>Categoria<select required value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}><option value="">Selecione uma categoria</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><RecipeEditor ingredients={ingredients} recipe={recipe} onChange={setRecipe} /><button type="button" className="secondary-button" onClick={() => setShowCategory(!showCategory)}>{showCategory ? 'Fechar criação de categoria' : '＋ Criar categoria'}</button>{showCategory && <div className="inline-form"><input placeholder="Nome da categoria" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /><button type="button" className="secondary-button" disabled={!categoryName.trim()} onClick={() => void createCategory()}>Salvar</button></div>}{!categories.length && <p className="form-error">Crie uma categoria para continuar.</p>}{message && <p className="form-error">{message}</p>}<button className="primary-button full-button" disabled={!categories.length || !categoryId}>Salvar produto</button></form></Modal>
}

function CustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [address, setAddress] = useState(''); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await api.createCustomer({ name, contact, address: address || null }); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar cliente.') } }
  return <Modal title="Novo cliente" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Contato<input required value={contact} onChange={(event) => setContact(event.target.value)} /></label><label>Endereço<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar cliente</button></form></Modal>
}

function IngredientModal({ suppliers, onClose, onCreated }: { suppliers: Supplier[]; onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(''); const [quantity, setQuantity] = useState(''); const [unit, setUnit] = useState('unidade'); const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? 0); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); const normalizedQuantity = decimalValue(quantity); if (!normalizedQuantity || Number(normalizedQuantity) < 0) { setMessage('Informe uma quantidade válida, sem conversão automática.'); return } try { await api.createIngredient({ name, stock_quantity: normalizedQuantity, unit, supplier_id: supplierId }); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar ingrediente.') } }
  return <Modal title="Novo ingrediente" onClose={onClose}><form onSubmit={submit}><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Quantidade<input required min="0" inputMode="decimal" placeholder="Ex.: 1,5" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label>Unidade<input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label><label>Fornecedor<select required value={supplierId} onChange={(event) => setSupplierId(Number(event.target.value))}>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>{!suppliers.length && <p className="form-error">Cadastre um fornecedor antes do ingrediente.</p>}{message && <p className="form-error">{message}</p>}<button className="primary-button full-button" disabled={!suppliers.length}>Salvar ingrediente</button></form></Modal>
}

function SupplierModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); try { await api.createSupplier({ name, contact: contact || null }); await onCreated() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao criar fornecedor.') } }
  return <Modal title="Novo fornecedor" onClose={onClose}><form onSubmit={submit}><label>Nome<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Contato<input value={contact} onChange={(event) => setContact(event.target.value)} /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar fornecedor</button></form></Modal>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><button className="close-button" onClick={onClose}>×</button></div>{children}</div></div>
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div> }
function Empty({ text }: { text: string }) { return <div className="empty-state"><span>{text}</span></div> }
function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>Dados da API</small></div></div> }
function RowActions({ onEdit, onDelete }: { onEdit: () => void | Promise<void>; onDelete: () => void | Promise<void> }) { return <div className="row-actions"><button type="button" className="row-action-button" title="Editar" onClick={() => void onEdit()}>✎</button><button type="button" className="row-action-button danger" title="Remover" onClick={() => void onDelete()}>−</button></div> }
function OrderRow({ order, customers, onChanged }: { order: Order; customers: Customer[]; onChanged?: () => void }) {
  const customer = customers.find((item) => item.id === order.customer_id)
  const [editing, setEditing] = useState(false)
  return <><div className="order-row"><div className="order-avatar orange">{customer?.name.slice(0, 2).toUpperCase() ?? '—'}</div><div className="order-details"><strong>{customer?.name ?? 'Cliente não identificado'}</strong><span>{order.delivery_type} · canal {order.channel}</span></div><div className="order-total"><strong>{money(order.total)}</strong><span>Pedido #{order.id}</span></div><span className="status-pill">Status #{order.status_id}</span>{onChanged && <RowActions onEdit={() => setEditing(true)} onDelete={async () => { if (window.confirm(`Remover o pedido #${order.id}?`)) { await api.deleteOrder(order.id); onChanged() } }} />}</div>{editing && onChanged && <OrderEditModal order={order} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onChanged() }} />}</>
}

function OrderEditModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [statusId, setStatusId] = useState(String(order.status_id)); const [message, setMessage] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!Number.isInteger(Number(statusId)) || Number(statusId) < 1) { setMessage('Informe um status válido.'); return } try { await api.updateOrderStatus(order.id, Number(statusId)); onSaved() } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Erro ao atualizar pedido.') } }
  return <Modal title={`Editar pedido #${order.id}`} onClose={onClose}><form onSubmit={submit}><label>ID do status<input required min="1" type="number" value={statusId} onChange={(event) => setStatusId(event.target.value)} /></label><p className="form-hint">O status deve existir na tabela de status do pedido.</p>{message && <p className="form-error">{message}</p>}<button className="primary-button full-button">Salvar alterações</button></form></Modal>
}

export default App

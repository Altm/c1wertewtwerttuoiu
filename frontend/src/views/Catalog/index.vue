<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface ProductComponent {
  product_id: number
  quantity: number
}

interface Product {
  id: number
  name: string
  type: 'wine' | 'olives' | 'composite'
  price: number
  stock: number
  // Wine specific
  vintage_year?: number
  volume_l?: number
  alcohol_pct?: number
  glasses_per_bottle?: number
  // Olives specific
  weight_g?: number
  calories_per_100g?: number
  has_pit?: boolean
  // Composite specific
  components?: ProductComponent[]
  children?: Product[]
}

const loading = ref(false)
const tableData = ref<Product[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const defaultProduct: Product = {
  id: 0,
  name: '',
  type: 'wine',
  price: 0,
  stock: 0,
  vintage_year: 2023,
  volume_l: 0.75,
  alcohol_pct: 12.5,
  glasses_per_bottle: 5,
  weight_g: 300,
  calories_per_100g: 150,
  has_pit: true,
  components: []
}

const currentProduct = reactive<Product>({ ...defaultProduct })

const fetchCatalog = async () => {
  loading.value = true
  try {
    // Mock data to demonstrate Tree Table functionality
    // In production, replace with: const res = await axios.get('/api/v1/catalog')
    setTimeout(() => {
      tableData.value = [
        {
          id: 1,
          name: 'Cabernet Sauvignon 2018',
          type: 'wine',
          price: 1200,
          stock: 45,
          vintage_year: 2018,
          volume_l: 0.75,
          alcohol_pct: 13.5,
          glasses_per_bottle: 6
        },
        {
          id: 2,
          name: 'Greek Olives',
          type: 'olives',
          price: 350,
          stock: 120,
          weight_g: 300,
          calories_per_100g: 115,
          has_pit: true
        },
        {
          id: 3,
          name: 'Wine & Snack Set',
          type: 'composite',
          price: 1500,
          stock: 10,
          children: [
            {
              id: 101,
              name: 'Cabernet Sauvignon 2018 (1 btl)',
              type: 'wine',
              price: 1200,
              stock: 45,
              vintage_year: 2018,
              volume_l: 0.75,
              alcohol_pct: 13.5,
              glasses_per_bottle: 6
            },
            {
              id: 102,
              name: 'Greek Olives (1 can)',
              type: 'olives',
              price: 350,
              stock: 120,
              weight_g: 300,
              calories_per_100g: 115,
              has_pit: true
            }
          ]
        }
      ]
      loading.value = false
    }, 500)
  } catch (e) {
    loading.value = false
  }
}

const handleAdd = () => {
  Object.assign(currentProduct, defaultProduct)
  currentProduct.components = []
  dialogType.value = 'add'
  dialogVisible.value = true
}

const handleEdit = (row: Product) => {
  Object.assign(currentProduct, JSON.parse(JSON.stringify(row)))
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const handleDelete = (row: Product) => {
  ElMessageBox.confirm(`Delete ${row.name}?`, 'Warning', { type: 'warning' })
    .then(() => {
      ElMessage.success('Deleted')
      fetchCatalog()
    })
}

const saveProduct = () => {
  ElMessage.success('Saved successfully')
  dialogVisible.value = false
  fetchCatalog()
}

const addComponent = () => {
  if (!currentProduct.components) currentProduct.components = []
  currentProduct.components.push({ product_id: 0, quantity: 1 })
}

const removeComponent = (index: number) => {
  currentProduct.components?.splice(index, 1)
}

onMounted(() => {
  fetchCatalog()
})
</script>

<template>
  <div class="app-container p-4">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">Catalog & Inventory</h2>
      <el-button type="primary" @click="handleAdd">Add Product</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="name" label="Name" min-width="200" />

      <el-table-column prop="type" label="Type" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'composite' ? 'warning' : 'success'">
            {{ row.type.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Attributes" min-width="250">
        <template #default="{ row }">
          <div v-if="row.type === 'wine'" class="text-xs">
            Vintage: {{ row.vintage_year }} | Vol: {{ row.volume_l }}L | Alc: {{ row.alcohol_pct }}%
          </div>
          <div v-else-if="row.type === 'olives'" class="text-xs">
            Weight: {{ row.weight_g }}g | {{ row.calories_per_100g }}kcal | {{ row.has_pit ? 'Pit' : 'No Pit' }}
          </div>
          <div v-else-if="row.type === 'composite'" class="text-xs text-gray-500">
            <i>Contains {{ row.children?.length || 0 }} items</i>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="stock" label="Stock" width="100" align="center" />
      <el-table-column prop="price" label="Price" width="100" align="right" />

      <el-table-column label="Actions" width="150" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">Edit</el-button>
          <el-button link type="danger" @click="handleDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? 'Add Product' : 'Edit Product'" width="600px">
      <el-form :model="currentProduct" label-width="140px">
        <el-form-item label="Name"><el-input v-model="currentProduct.name" /></el-form-item>
        <el-form-item label="Type">
          <el-select v-model="currentProduct.type" class="w-full">
            <el-option label="Wine" value="wine" />
            <el-option label="Olives" value="olives" />
            <el-option label="Composite" value="composite" />
          </el-select>
        </el-form-item>
        <el-form-item label="Price"><el-input-number v-model="currentProduct.price" :min="0" /></el-form-item>
        <el-form-item label="Stock"><el-input-number v-model="currentProduct.stock" :min="0" /></el-form-item>

        <el-divider content-position="left">Characteristics</el-divider>

        <template v-if="currentProduct.type === 'wine'">
          <el-form-item label="Vintage"><el-input-number v-model="currentProduct.vintage_year" /></el-form-item>
          <el-form-item label="Volume (L)"><el-input-number v-model="currentProduct.volume_l" :step="0.1" /></el-form-item>
          <el-form-item label="Alcohol %"><el-input-number v-model="currentProduct.alcohol_pct" :step="0.1" /></el-form-item>
        </template>

        <template v-if="currentProduct.type === 'olives'">
          <el-form-item label="Weight (g)"><el-input-number v-model="currentProduct.weight_g" /></el-form-item>
          <el-form-item label="Calories"><el-input-number v-model="currentProduct.calories_per_100g" /></el-form-item>
          <el-form-item label="Has Pit"><el-switch v-model="currentProduct.has_pit" /></el-form-item>
        </template>

        <template v-if="currentProduct.type === 'composite'">
          <div v-for="(comp, index) in currentProduct.components" :key="index" class="flex gap-2 mb-2">
            <el-input v-model="comp.product_id" placeholder="ID" style="width: 80px" />
            <el-input-number v-model="comp.quantity" placeholder="Qty" style="width: 120px" />
            <el-button type="danger" circle @click="removeComponent(index)">x</el-button>
          </div>
          <el-button size="small" @click="addComponent">Add Component</el-button>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveProduct">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

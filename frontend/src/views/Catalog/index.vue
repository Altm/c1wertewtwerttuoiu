<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/axios'

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
  expanded?: boolean
  level?: number
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
  // Additional fields from API response
  product_type_id?: number
  is_composite?: boolean
  is_active?: boolean
  sku?: string
  primary_category?: string
  base_unit_code?: string
}

// Backend API calls
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
  components: [],
  // Additional fields from API response (with sensible defaults)
  product_type_id: 0,
  is_composite: false,
  is_active: true,
  sku: '',
  primary_category: 'wine',
  base_unit_code: 'bottle'
}

const currentProduct = reactive<Product>({ ...defaultProduct })

const fetchCatalog = async () => {
  loading.value = true
  try {
    // Get all products from backend API (this gives us product metadata)
    const productsRes = await request.get({ url: '/api/v1/products' });
    // Also get catalog data which includes pricing and stock info
    const catalogRes = await request.get({ url: '/api/v1/catalog?location=1' });

    // Create a map of catalog data by product ID for quick lookup
    const catalogMap: Record<number, any> = {};
    if (catalogRes && catalogRes.data && Array.isArray(catalogRes.data.items)) {
      catalogRes.data.items.forEach(item => {
        catalogMap[item.id] = item;
      });
    }

    // Transform backend data to match our interface
    if (productsRes && productsRes.data && Array.isArray(productsRes.data)) {
      tableData.value = productsRes.data.map(item => {
        // Get corresponding catalog data if available
        const catalogData = catalogMap[item.id];
        
        return {
          id: item.id,
          name: item.name,
          type: item.is_composite ? 'composite' : item.primary_category || 'wine',
          price: catalogData?.price || 0, // Use catalog data if available, otherwise default to 0
          stock: catalogData?.stock || 0, // Use catalog data if available, otherwise default to 0
          // Map product attributes directly from products API response
          vintage_year: item.vintage_year,
          volume_l: item.volume_l,
          alcohol_pct: item.alcohol_pct,
          glasses_per_bottle: item.glasses_per_bottle,
          weight_g: item.weight_g,
          calories_per_100g: item.calories_per_100g,
          has_pit: item.has_pit,
          children: item.children || [], // Child components for composite products
          // Store original API fields that might be useful
          product_type_id: item.product_type_id,
          is_composite: item.is_composite,
          is_active: item.is_active,
          sku: item.sku,
          primary_category: item.primary_category,
          base_unit_code: item.base_unit_code
        };
      });
    } else {
      console.warn('Invalid data structure received from API:', productsRes);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching catalog:', error)
    ElMessage.error('Failed to load catalog')
  } finally {
    loading.value = false
  }
}

const fetchCatalogByLocation = async (locationId: number) => {
  loading.value = true
  try {
    // Get catalog filtered by location from backend API
    const res = await request.get({ url: `/api/v1/catalog?location=${locationId}` })
    
    // Transform backend response to match our interface
    // For now, just map the basic fields, later we could enhance with child components
    if (res && res.data && res.data.items && Array.isArray(res.data.items)) {
      tableData.value = res.data.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.category || 'wine', // Use category from backend
        price: item.price || 0,
        stock: item.stock || 0,
        children: [] // Will be populated if this is a composite product
      }))
    } else {
      console.warn('Invalid data structure received from API:', res);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching catalog by location:', error)
    ElMessage.error('Failed to load catalog')
  } finally {
    loading.value = false
  }
}

const fetchAllProducts = async () => {
  loading.value = true
  try {
    // Get all products from backend API (this gives us product metadata)
    const productsRes = await request.get({ url: '/api/v1/products' });
    // Also get catalog data which includes pricing and stock info
    const catalogRes = await request.get({ url: '/api/v1/catalog?location=1' });

    // Create a map of catalog data by product ID for quick lookup
    const catalogMap: Record<number, any> = {};
    if (catalogRes && catalogRes.data && Array.isArray(catalogRes.data.items)) {
      catalogRes.data.items.forEach(item => {
        catalogMap[item.id] = item;
      });
    }

    // Transform backend data to match our interface
    if (productsRes && productsRes.data && Array.isArray(productsRes.data)) {
      tableData.value = productsRes.data.map(item => {
        // Get corresponding catalog data if available
        const catalogData = catalogMap[item.id];
        
        return {
          id: item.id,
          name: item.name,
          type: item.is_composite ? 'composite' : item.primary_category || 'wine',
          price: catalogData?.price || 0, // Use catalog data if available, otherwise default to 0
          stock: catalogData?.stock || 0, // Use catalog data if available, otherwise default to 0
          // Map product attributes directly from products API response
          vintage_year: item.vintage_year,
          volume_l: item.volume_l,
          alcohol_pct: item.alcohol_pct,
          glasses_per_bottle: item.glasses_per_bottle,
          weight_g: item.weight_g,
          calories_per_100g: item.calories_per_100g,
          has_pit: item.has_pit,
          children: item.children || [], // Child components for composite products
          // Store original API fields that might be useful
          product_type_id: item.product_type_id,
          is_composite: item.is_composite,
          is_active: item.is_active,
          sku: item.sku,
          primary_category: item.primary_category,
          base_unit_code: item.base_unit_code
        };
      });
    } else {
      console.warn('Invalid data structure received from API:', productsRes);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    ElMessage.error('Failed to load products')
  } finally {
    loading.value = false
  }
}

const saveProduct = async () => {
  try {
    // Prepare data for API - only send essential fields to avoid conflicts
    const productData = {
      id: currentProduct.id,
      name: currentProduct.name,
      type: currentProduct.type,
      price: currentProduct.price,
      stock: currentProduct.stock,
      // Wine specific
      vintage_year: currentProduct.vintage_year,
      volume_l: currentProduct.volume_l,
      alcohol_pct: currentProduct.alcohol_pct,
      glasses_per_bottle: currentProduct.glasses_per_bottle,
      // Olives specific
      weight_g: currentProduct.weight_g,
      calories_per_100g: currentProduct.calories_per_100g,
      has_pit: currentProduct.has_pit,
      // Composite specific
      components: currentProduct.components,
      // Additional fields
      product_type_id: currentProduct.product_type_id,
      is_composite: currentProduct.is_composite,
      is_active: currentProduct.is_active,
      sku: currentProduct.sku,
      primary_category: currentProduct.primary_category,
      base_unit_code: currentProduct.base_unit_code
    };

    if (dialogType.value === 'add') {
      await request.post({ url: '/api/v1/products', data: productData })
    } else {
      await request.put({ url: `/api/v1/products/${currentProduct.id}`, data: productData })
    }
    ElMessage.success('Saved successfully')
    dialogVisible.value = false
    fetchCatalog()
  } catch (error) {
    console.error('Error saving product:', error)
    ElMessage.error('Failed to save product')
  }
}

const deleteProduct = async (productId: number) => {
  try {
    await request.delete({ url: `/api/v1/products/${productId}` })
    ElMessage.success('Deleted successfully')
    fetchCatalog()
  } catch (error) {
    console.error('Error deleting product:', error)
    ElMessage.error('Failed to delete product')
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
      deleteProduct(row.id)
    })
}

const addComponent = () => {
  if (!currentProduct.components) currentProduct.components = []
  currentProduct.components.push({ product_id: 0, quantity: 1 })
}

const removeComponent = (index: number) => {
  currentProduct.components?.splice(index, 1)
}

// Toggle expand for composite products
const toggleExpand = (row: Product) => {
  // Element Plus handles expansion automatically when using tree table
  // This is just for UI feedback
  row.expanded = !row.expanded
}

onMounted(() => {
  fetchAllProducts() // Fetch all products initially
})
</script>

<template>
  <div class="app-container p-4">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">Catalog & Inventory</h2>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleAdd">Add Product</el-button>
        <el-button @click="fetchCatalogByLocation(1)">View by Location</el-button>
        <el-button @click="fetchAllProducts">View All Products</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="name" label="Product Name" min-width="200">
        <template #default="{ row }">
          <span :style="{ paddingLeft: (row.level || 0) * 20 + 'px' }">{{ row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="type" label="Type" width="120">
        <template #default="{ row }">
          <el-tag 
            :type="row.type === 'composite' ? 'warning' : 
                   row.type === 'wine' ? 'success' : 'info'"
          >
            {{ row.type.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Attributes" min-width="250">
        <template #default="{ row }">
          <div v-if="row.type === 'wine'" class="text-xs text-gray-600">
            <div v-if="row.vintage_year">Vintage: {{ row.vintage_year }}</div>
            <div v-if="row.volume_l">Volume: {{ row.volume_l }}L</div>
            <div v-if="row.alcohol_pct">Alcohol: {{ row.alcohol_pct }}%</div>
            <div v-if="row.glasses_per_bottle">Glasses per bottle: {{ row.glasses_per_bottle }}</div>
          </div>
          <div v-else-if="row.type === 'olives'" class="text-xs text-gray-600">
            <div v-if="row.weight_g">Weight: {{ row.weight_g }}g</div>
            <div v-if="row.calories_per_100g">Calories: {{ row.calories_per_100g }}/100g</div>
            <div v-if="row.has_pit !== undefined">Pit: {{ row.has_pit ? 'Yes' : 'No' }}</div>
          </div>
          <div v-else-if="row.type === 'composite'" class="text-xs text-purple-600">
            <i>Composite product with {{ row.children?.length || 0 }} components</i>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="stock" label="Stock" width="100" align="center" />
      <el-table-column prop="price" label="Price" width="100" align="right">
        <template #default="{ row }">
          ${{ parseFloat(row.price || 0).toFixed(2) }}
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="180" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">Edit</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">Delete</el-button>
          <el-button 
            v-if="row.type === 'composite'" 
            link 
            type="info" 
            size="small" 
            @click="toggleExpand(row)"
          >
            {{ row.expanded ? 'Collapse' : 'Expand' }}
          </el-button>
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

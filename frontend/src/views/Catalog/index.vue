<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/axios'
import { useI18n } from 'vue-i18n'
import { listProducts, fetchCatalog } from '@/api/cavina'

interface Product {
  id: number
  name: string
  product_type_id: number
  is_composite: boolean
  is_active: boolean
  sku: string
  primary_category: string
  base_unit_code: string
  tax_flags: any
  price?: number
  stock?: number
}

// Backend API calls
const loading = ref(false)
const tableData = ref<Product[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const { t } = useI18n()

const defaultProduct: Product = {
  id: 0,
  name: '',
  product_type_id: 0,
  is_composite: false,
  is_active: true,
  sku: '',
  primary_category: 'wine',
  base_unit_code: 'bottle',
  tax_flags: null
}

const currentProduct = reactive<Product>({ ...defaultProduct })

const fetchCatalogData = async () => {
  loading.value = true
  try {
    // Get all products from backend API
    const productsRes = await listProducts();

    // Transform backend data to match our interface
    if (productsRes && Array.isArray(productsRes)) {
      tableData.value = productsRes.map(item => ({
        id: item.id,
        name: item.name,
        product_type_id: item.product_type_id,
        is_composite: item.is_composite,
        is_active: item.is_active,
        sku: item.sku,
        primary_category: item.primary_category,
        base_unit_code: item.base_unit_code,
        tax_flags: item.tax_flags
      }));
    } else {
      console.warn('Invalid data structure received from API:', productsRes);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching catalog:', error)
    ElMessage.error(t('common.catalogLoadError'))
  } finally {
    loading.value = false
  }
}

const fetchCatalogByLocation = async (locationId: number) => {
  loading.value = true
  try {
    // Get catalog filtered by location from backend API
    const res = await fetchCatalog(locationId)
    
    // Transform backend response to match our interface
    if (res && res.items && Array.isArray(res.items)) {
      tableData.value = res.items.map(item => ({
        id: item.id,
        name: item.name,
        product_type_id: item.product_type_id,
        is_composite: item.is_composite,
        is_active: item.is_active,
        sku: item.sku,
        primary_category: item.primary_category,
        base_unit_code: item.base_unit_code,
        tax_flags: item.tax_flags,
        price: item.price,
        stock: item.stock
      }))
    } else {
      console.warn('Invalid data structure received from API:', res);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching catalog by location:', error)
    ElMessage.error(t('common.catalogLoadError'))
  } finally {
    loading.value = false
  }
}

const saveProduct = async () => {
  try {
    // Prepare data for API
    const productData = {
      id: currentProduct.id,
      name: currentProduct.name,
      product_type_id: currentProduct.product_type_id,
      is_composite: currentProduct.is_composite,
      is_active: currentProduct.is_active,
      sku: currentProduct.sku,
      primary_category: currentProduct.primary_category,
      base_unit_code: currentProduct.base_unit_code,
      tax_flags: currentProduct.tax_flags
    };

    if (dialogType.value === 'add') {
      await request.post({ url: '/api/v1/products', data: productData })
    } else {
      await request.put({ url: `/api/v1/products/${currentProduct.id}`, data: productData })
    }
    ElMessage.success(t('common.saveSuccess'))
    dialogVisible.value = false
    fetchCatalogData()
  } catch (error) {
    console.error('Error saving product:', error)
    ElMessage.error(t('common.saveError'))
  }
}

const deleteProduct = async (productId: number) => {
  try {
    await request.delete({ url: `/api/v1/products/${productId}` })
    ElMessage.success(t('common.deleteSuccess'))
    fetchCatalogData()
  } catch (error) {
    console.error('Error deleting product:', error)
    ElMessage.error(t('common.deleteError'))
  }
}

const handleAdd = () => {
  Object.assign(currentProduct, defaultProduct)
  dialogType.value = 'add'
  dialogVisible.value = true
}

const handleEdit = (row: Product) => {
  Object.assign(currentProduct, JSON.parse(JSON.stringify(row)))
  dialogType.value = 'edit'
  dialogVisible.value = true
}

const handleDelete = (row: Product) => {
  ElMessageBox.confirm(t('common.deleteConfirm').replace('{name}', row.name), t('common.warning'), { type: 'warning' })
    .then(() => {
      deleteProduct(row.id)
    })
}

onMounted(() => {
  fetchCatalogData() // Fetch catalog initially
})
</script>

<template>
  <div class="app-container p-4">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">{{ t('common.catalogTitle') }}</h2>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleAdd">{{ t('common.addProduct') }}</el-button>
        <el-button @click="fetchCatalogByLocation(1)">{{ t('common.viewByLocation') }}</el-button>
        <el-button @click="fetchCatalogData">{{ t('common.viewAllProducts') }}</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
    >
      <el-table-column prop="name" label="Product Name" min-width="200" />
      
      <el-table-column prop="primary_category" label="Category" width="120">
        <template #default="{ row }">
          <el-tag 
            :type="row.primary_category === 'wine' ? 'success' : 
                   row.primary_category === 'bakery' ? 'warning' :
                   row.primary_category === 'grocery' ? 'info' :
                   row.primary_category === 'snack' ? 'danger' :
                   'primary'"
          >
            {{ row.primary_category }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="sku" label="SKU" width="120" />

      <el-table-column prop="base_unit_code" label="Unit" width="100" />

      <el-table-column prop="is_composite" label="Is Composite" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_composite ? 'success' : 'info'">
            {{ row.is_composite ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="is_active" label="Status" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'danger'">
            {{ row.is_active ? 'Active' : 'Inactive' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="stock" label="Stock" width="100" align="center" />
      <el-table-column prop="price" label="Price" width="100" align="right">
        <template #default="{ row }">
          <span v-if="row.price">${{ parseFloat(row.price || 0).toFixed(2) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.actions')" width="150" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? t('common.addProduct') : t('common.editProduct')" width="600px">
      <el-form :model="currentProduct" label-width="140px">
        <el-form-item :label="t('common.name')"><el-input v-model="currentProduct.name" /></el-form-item>
        <el-form-item :label="t('common.category')">
          <el-select v-model="currentProduct.primary_category" class="w-full">
            <el-option label="Wine" value="wine" />
            <el-option label="Bakery" value="bakery" />
            <el-option label="Grocery" value="grocery" />
            <el-option label="Snack" value="snack" />
            <el-option label="Set" value="set" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.sku')"><el-input v-model="currentProduct.sku" /></el-form-item>
        <el-form-item :label="t('common.unit')">
          <el-select v-model="currentProduct.base_unit_code" class="w-full">
            <el-option label="Bottle" value="bottle" />
            <el-option label="Loaf" value="loaf_fraction" />
            <el-option label="Jar" value="jar_fraction" />
            <el-option label="Piece" value="piece" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.isComposite')">
          <el-switch v-model="currentProduct.is_composite" />
        </el-form-item>
        <el-form-item :label="t('common.isActive')">
          <el-switch v-model="currentProduct.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveProduct">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import request from '@/axios'

interface Product {
  id: number
  name: string
  product_type_id: number
  is_composite: boolean
  is_active: boolean
  tax_flags: any
  sku: string
  primary_category: string
  base_unit_code: string
}

const { t } = useI18n()

// Backend API calls
const loading = ref(false)
const tableData = ref<Product[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const defaultProduct: Product = {
  id: 0,
  name: '',
  product_type_id: 0,
  is_composite: false,
  is_active: true,
  tax_flags: null,
  sku: '',
  primary_category: 'wine',
  base_unit_code: 'bottle'
}

const currentProduct = reactive<Product>({ ...defaultProduct })

const fetchCatalog = async () => {
  loading.value = true
  try {
    // Get products from the API
    const res = await request.get({ url: '/api/v1/products' });
    
    if (res && res.data && Array.isArray(res.data)) {
      // Map the API response to our interface
      tableData.value = res.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        product_type_id: item.product_type_id,
        is_composite: item.is_composite,
        is_active: item.is_active,
        tax_flags: item.tax_flags,
        sku: item.sku,
        primary_category: item.primary_category,
        base_unit_code: item.base_unit_code
      }));
    } else {
      console.warn('Invalid data structure received from API:', res);
      tableData.value = [];
    }
  } catch (error) {
    console.error('Error fetching catalog:', error)
    ElMessage.error(t('common.networkError'))
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
      tax_flags: currentProduct.tax_flags,
      sku: currentProduct.sku,
      primary_category: currentProduct.primary_category,
      base_unit_code: currentProduct.base_unit_code
    };

    if (dialogType.value === 'add') {
      await request.post({ url: '/api/v1/products', data: productData })
    } else {
      await request.put({ url: `/api/v1/products/${currentProduct.id}`, data: productData })
    }
    ElMessage.success(dialogType.value === 'add' ? t('common.addSuccess') : t('common.editSuccess'))
    dialogVisible.value = false
    fetchCatalog()
  } catch (error) {
    console.error('Error saving product:', error)
    ElMessage.error(t('common.networkError'))
  }
}

const deleteProduct = async (productId: number) => {
  try {
    await request.delete({ url: `/api/v1/products/${productId}` })
    ElMessage.success(t('common.delSuccess'))
    fetchCatalog()
  } catch (error) {
    console.error('Error deleting product:', error)
    ElMessage.error(t('common.networkError'))
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
  ElMessageBox.confirm(`${t('common.delWarning')} ${row.name}?`, t('common.reminder'), { type: 'warning' })
    .then(() => {
      deleteProduct(row.id)
    }).catch(() => {
      // User cancelled the deletion
    })
}

onMounted(() => {
  fetchCatalog() // Fetch products initially
})
</script>

<template>
  <div class="app-container p-4">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-bold">{{ t('router.catalog') }}</h2>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleAdd">{{ t('common.add') }}</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
    >
      <el-table-column prop="name" :label="t('common.name')" min-width="200" />
      
      <el-table-column prop="sku" :label="t('common.sku')" width="120" />

      <el-table-column :label="t('common.type')" width="120">
        <template #default="{ row }">
          <el-tag 
            :type="row.is_composite ? 'warning' : 
                   row.primary_category === 'wine' ? 'success' : 
                   row.primary_category === 'bakery' ? 'primary' : 
                   row.primary_category === 'grocery' ? 'info' : 'default'"
          >
            {{ row.is_composite ? t('common.composite') : row.primary_category.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="primary_category" :label="t('router.category')" width="120" />

      <el-table-column prop="base_unit_code" :label="t('common.unit')" width="100" />

      <el-table-column :label="t('common.status')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'danger'">
            {{ row.is_active ? t('common.active') : t('common.inactive') }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.actions')" width="150" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">{{ t('common.del') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? t('common.add') + ' ' + t('router.catalog') : t('common.edit') + ' ' + t('router.catalog')" width="600px">
      <el-form :model="currentProduct" label-width="140px">
        <el-form-item :label="t('common.name')">
          <el-input v-model="currentProduct.name" />
        </el-form-item>
        <el-form-item :label="t('common.sku')">
          <el-input v-model="currentProduct.sku" />
        </el-form-item>
        <el-form-item :label="t('router.category')">
          <el-select v-model="currentProduct.primary_category" class="w-full">
            <el-option :label="t('common.wine')" value="wine" />
            <el-option :label="t('common.bakery')" value="bakery" />
            <el-option :label="t('common.grocery')" value="grocery" />
            <el-option :label="t('common.snack')" value="snack" />
            <el-option :label="t('common.set')" value="set" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.unit')">
          <el-input v-model="currentProduct.base_unit_code" />
        </el-form-item>
        <el-form-item :label="t('common.active')">
          <el-switch v-model="currentProduct.is_active" />
        </el-form-item>
        <el-form-item :label="t('common.composite')">
          <el-switch v-model="currentProduct.is_composite" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveProduct">{{ t('common.ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

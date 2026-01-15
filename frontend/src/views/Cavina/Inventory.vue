<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCatalog, listProducts, adjustStock } from '@/api/cavina'

interface CatalogItem {
  id: number
  name: string
  sku: string
  price: number | null
  currency: string | null
  stock: number
  unit: string
  category: string
}

const locationId = ref<number>(1)
const catalog = ref<CatalogItem[]>([])
const loading = ref(false)
const products = ref<any[]>([])

const adjustForm = reactive({
  location_id: 1,
  product_id: undefined as number | undefined,
  quantity: 1 as number | undefined,
  unit: ''
})

const productOptions = computed(() =>
  products.value.map((p) => ({
    label: `${p.name} (${p.sku})`,
    value: p.id,
    unit: p.base_unit_code
  }))
)

const loadCatalog = async () => {
  loading.value = true
  try {
    const res = await fetchCatalog(locationId.value)
    catalog.value = res.items as CatalogItem[]
  } finally {
    loading.value = false
  }
}

const loadProducts = async () => {
  products.value = await listProducts()
}

const onProductChange = (id: number) => {
  const selected = productOptions.value.find((p) => p.value === id)
  adjustForm.unit = selected?.unit || ''
}

const submitAdjust = async () => {
  if (!adjustForm.product_id || adjustForm.quantity === undefined) {
    ElMessage.warning('Выберите продукт и количество')
    return
  }
  await adjustStock({
    location_id: locationId.value,
    product_id: adjustForm.product_id,
    quantity: adjustForm.quantity,
    unit: adjustForm.unit || 'bottle'
  })
  ElMessage.success('Остаток обновлен')
  await loadCatalog()
}

onMounted(async () => {
  adjustForm.location_id = locationId.value
  await Promise.all([loadCatalog(), loadProducts()])
})
</script>

<template>
  <div class="space-y-4">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span>Каталог и остатки</span>
          <div class="flex items-center gap-2">
            <ElInput
              v-model="locationId"
              type="number"
              placeholder="ID локации"
              style="width: 180px"
            />
            <ElButton type="primary" @click="loadCatalog">Обновить</ElButton>
          </div>
        </div>
      </template>
      <ElTable :data="catalog" v-loading="loading" border>
        <ElTableColumn prop="id" label="ID" width="70" />
        <ElTableColumn prop="name" label="Название" />
        <ElTableColumn prop="sku" label="SKU" width="120" />
        <ElTableColumn prop="category" label="Категория" width="140" />
        <ElTableColumn prop="stock" label="Остаток" width="120">
          <template #default="scope">
            {{ scope.row.stock }} {{ scope.row.unit }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="price" label="Цена" width="120">
          <template #default="scope">
            <span v-if="scope.row.price !== null">
              {{ scope.row.price }} {{ scope.row.currency }}
            </span>
            <span v-else>—</span>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard>
      <template #header>Корректировка остатков</template>
      <ElForm :model="adjustForm" label-width="140px" class="w-full max-w-2xl">
        <ElFormItem label="Продукт">
          <ElSelect
            v-model="adjustForm.product_id"
            placeholder="Выберите продукт"
            filterable
            @change="onProductChange"
          >
            <ElOption
              v-for="item in productOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Количество">
          <ElInput v-model.number="adjustForm.quantity" type="number" />
        </ElFormItem>
        <ElFormItem label="Единица">
          <ElInput v-model="adjustForm.unit" placeholder="Например bottle / glass / gram" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="submitAdjust">Сохранить</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { type LiquityPoolDetail } from '@rotki/common/lib/liquity';
import { type PropType } from 'vue';
import StatCard from '@/components/display/StatCard.vue';

defineProps({
  pool: {
    required: false,
    type: Object as PropType<LiquityPoolDetail | null>,
    default: null
  }
});

const { tc } = useI18n();
</script>
<template>
  <stat-card :title="tc('liquity_pools.title')">
    <template v-if="pool">
      <div class="d-flex align-center py-4 justify-end">
        <balance-display
          :asset="pool.deposited.asset"
          :value="pool.deposited"
          icon-size="32px"
        />
      </div>
      <v-divider />
      <div class="pt-4">
        <div class="d-flex align-center mb-1 justify-space-between">
          <div class="grey--text">{{ tc('liquity_pools.rewards') }}</div>
          <div>
            <balance-display
              :asset="pool.rewards.asset"
              :value="pool.rewards"
            />
          </div>
        </div>
        <div class="d-flex align-center mb-1 justify-space-between">
          <div class="grey--text">
            {{ tc('liquity_pools.liquidation_gains') }}
          </div>
          <div>
            <balance-display :asset="pool.gains.asset" :value="pool.gains" />
          </div>
        </div>
      </div>
    </template>
    <div v-else class="text-center grey--text pt-4">
      {{ tc('liquity_pools.no_lusd_deposited') }}
    </div>
  </stat-card>
</template>

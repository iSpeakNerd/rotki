<script setup lang="ts">
import { type BigNumber } from '@rotki/common';
import { type GeneralAccount } from '@rotki/common/lib/account';
import { Blockchain, DefiProtocol } from '@rotki/common/lib/blockchain';
import ActiveModules from '@/components/defi/ActiveModules.vue';
import DepositProtocolReset from '@/components/defi/DepositProtocolReset.vue';
import DepositTotals from '@/components/defi/DepositTotals.vue';
import LendingAssetTable from '@/components/defi/display/LendingAssetTable.vue';
import YearnAssetsTable from '@/components/defi/yearn/YearnAssetsTable.vue';
import PremiumCard from '@/components/display/PremiumCard.vue';
import StatCard from '@/components/display/StatCard.vue';
import BlockchainAccountSelector from '@/components/helper/BlockchainAccountSelector.vue';
import DefiProtocolSelector from '@/components/helper/DefiProtocolSelector.vue';
import ProgressScreen from '@/components/helper/ProgressScreen.vue';
import RefreshHeader from '@/components/helper/RefreshHeader.vue';
import {
  AaveEarnedDetails,
  CompoundLendingDetails,
  LendingHistory,
  YearnVaultsProfitDetails
} from '@/premium/premium';
import { ProtocolVersion } from '@/services/defi/consts';
import { useDefiStore } from '@/store/defi';
import { useAaveStore } from '@/store/defi/aave';
import { useDefiSupportedProtocolsStore } from '@/store/defi/protocols';
import { useYearnStore } from '@/store/defi/yearn';
import { useGeneralSettingsStore } from '@/store/settings/general';
import { type YearnVaultProfitLoss } from '@/types/defi/yearn';
import { Module } from '@/types/modules';
import { Section } from '@/types/status';

const section = Section.DEFI_LENDING;
const historySection = Section.DEFI_LENDING_HISTORY;
const modules: Module[] = [
  Module.AAVE,
  Module.COMPOUND,
  Module.YEARN,
  Module.YEARN_V2,
  Module.MAKERDAO_DSR
];

const chains = [Blockchain.ETH];

const selectedAccounts = ref<GeneralAccount[]>([]);
const protocol = ref<DefiProtocol | null>(null);
const premium = usePremium();
const route = useRoute();
const { openUrl } = useInterop();
const { shouldShowLoadingScreen, isSectionRefreshing } = useSectionLoading();
const { floatingPrecision } = storeToRefs(useGeneralSettingsStore());

const defiStore = useDefiStore();
const store = useDefiSupportedProtocolsStore();
const yearnStore = useYearnStore();
const aaveStore = useAaveStore();

const { tc } = useI18n();

const isProtocol = (protocol: DefiProtocol) =>
  computed(() => {
    const protocols = get(selectedProtocols);
    return protocols.length > 0 && protocols.includes(protocol);
  });

const selectedAddresses = useArrayMap(selectedAccounts, a => a.address);

const selectedProtocols = computed(() => {
  const selected = get(protocol);
  return selected ? [selected] : [];
});

const defiAddresses = computed(() => {
  const protocols = get(selectedProtocols);
  return get(defiStore.defiAccounts(protocols)).map(({ address }) => address);
});

const lendingBalances = computed(() => {
  const protocols = get(selectedProtocols);
  const addresses = get(selectedAddresses);
  return get(store.aggregatedLendingBalances(protocols, addresses));
});

const history = computed(() => {
  const protocols = get(selectedProtocols);
  const addresses = get(selectedAddresses);
  return get(store.lendingHistory(protocols, addresses));
});

const totalEarnedInAave = computed(() => {
  return get(aaveStore.aaveTotalEarned(get(selectedAddresses)));
});

const effectiveInterestRate = computed<string>(() => {
  const protocols = get(selectedProtocols);
  const addresses = get(selectedAddresses);
  return get(store.effectiveInterestRate(protocols, addresses));
});

const totalLendingDeposit = computed<BigNumber>(() => {
  const protocols = get(selectedProtocols);
  const addresses = get(selectedAddresses);
  return get(store.totalLendingDeposit(protocols, addresses));
});

const totalUsdEarned = computed<BigNumber>(() => {
  const protocols = get(selectedProtocols);
  const addresses = get(selectedAddresses);
  return get(store.totalUsdEarned(protocols, addresses));
});

const isCompound = isProtocol(DefiProtocol.COMPOUND);
const isAave = isProtocol(DefiProtocol.AAVE);
const isYearnVaults = isProtocol(DefiProtocol.YEARN_VAULTS);
const isYearnVaultsV2 = isProtocol(DefiProtocol.YEARN_VAULTS_V2);

const yearnVersion = computed(() => {
  if (get(isYearnVaults)) {
    return ProtocolVersion.V1;
  } else if (get(isYearnVaultsV2)) {
    return ProtocolVersion.V2;
  }
  return null;
});

const yearnProfit = computed(() => {
  const protocols = get(selectedProtocols);
  const allSelected = protocols.length === 0;
  const addresses = get(selectedAddresses);
  let v1Profit: YearnVaultProfitLoss[] = [];
  if (get(isYearnVaults) || allSelected) {
    v1Profit = get(yearnStore.yearnVaultsProfit(addresses, ProtocolVersion.V1));
  }

  let v2Profit: YearnVaultProfitLoss[] = [];
  if (get(isYearnVaultsV2) || allSelected) {
    v2Profit = get(yearnStore.yearnVaultsProfit(addresses, ProtocolVersion.V2));
  }
  return [...v1Profit, ...v2Profit];
});

const loading = shouldShowLoadingScreen(section);
const historyLoading = shouldShowLoadingScreen(historySection);
const historyRefreshing = isSectionRefreshing(historySection);
const refreshing = computed(
  () => get(isSectionRefreshing(section)) || get(historyRefreshing)
);

const refresh = async () => {
  await store.fetchLending(true);
};

const reset = async (protocols: DefiProtocol[]) => {
  await defiStore.resetDB(protocols);
};

onMounted(async () => {
  const currentRoute = get(route);
  const queryElement = currentRoute.query['protocol'];
  const protocols = Object.values(DefiProtocol);
  const protocolIndex = protocols.indexOf(queryElement as DefiProtocol);
  if (protocolIndex >= 0) {
    set(protocol, protocols[protocolIndex]);
  }
  await store.fetchLending();
});
</script>

<template>
  <progress-screen v-if="loading">
    <template #message>{{ tc('lending.loading') }}</template>
  </progress-screen>
  <div v-else>
    <v-row no-gutters align="center">
      <v-col>
        <refresh-header
          :loading="refreshing"
          :title="tc('common.deposits')"
          @refresh="refresh()"
        >
          <deposit-protocol-reset
            :loading="refreshing"
            @reset="reset($event)"
          />
          <template #actions>
            <active-modules :modules="modules" />
          </template>
        </refresh-header>
      </v-col>
    </v-row>
    <deposit-totals
      :loading="historyLoading"
      :effective-interest-rate="effectiveInterestRate"
      :total-lending-deposit="totalLendingDeposit"
      :total-usd-earned="totalUsdEarned"
    />
    <v-row class="mt-8" no-gutters>
      <v-col cols="12" sm="6" class="pe-sm-4">
        <blockchain-account-selector
          v-model="selectedAccounts"
          class="pt-2"
          hint
          outlined
          dense
          :chains="chains"
          :usable-addresses="defiAddresses"
        />
      </v-col>
      <v-col cols="12" sm="6" class="ps-sm-4 pt-4 pt-sm-0">
        <defi-protocol-selector v-model="protocol" />
      </v-col>
    </v-row>
    <v-row v-if="!isYearnVaults && !isYearnVaultsV2" class="mt-8" no-gutters>
      <v-col>
        <stat-card :title="tc('common.assets')">
          <lending-asset-table
            :loading="refreshing"
            :assets="lendingBalances"
          />
        </stat-card>
      </v-col>
    </v-row>
    <yearn-assets-table
      v-if="isYearnVaults || isYearnVaultsV2 || selectedProtocols.length === 0"
      class="mt-8"
      :version="yearnVersion"
      :loading="refreshing"
      :selected-addresses="selectedAddresses"
    />
    <template v-if="premium">
      <compound-lending-details
        v-if="isCompound"
        class="mt-8"
        :addresses="selectedAddresses"
      />
      <yearn-vaults-profit-details
        v-if="
          isYearnVaults || isYearnVaultsV2 || selectedProtocols.length === 0
        "
        class="mt-8"
        :profit="yearnProfit"
      />
      <aave-earned-details
        v-if="isAave || selectedProtocols.length === 0"
        class="mt-8"
        :profit="totalEarnedInAave"
      />
    </template>
    <v-row class="loans__history mt-8" no-gutters>
      <v-col cols="12">
        <premium-card v-if="!premium" :title="tc('lending.history')" />
        <lending-history
          v-else
          :loading="historyRefreshing"
          :history="history"
          :floating-precision="floatingPrecision"
          @open-link="openUrl($event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

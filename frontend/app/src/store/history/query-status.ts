import { type ComputedRef } from 'vue';
import {
  type EvmTransactionQueryData,
  EvmTransactionsQueryStatus
} from '@/types/websocket-messages';

export const useTxQueryStatusStore = defineStore(
  'history/transactionsQueryStatus',
  () => {
    const queryStatus = ref<Record<string, EvmTransactionQueryData>>({});

    const setQueryStatus = (data: EvmTransactionQueryData): void => {
      const status = { ...get(queryStatus) };
      const { address, evmChain } = data;
      const key = address + evmChain;

      if (data.status === EvmTransactionsQueryStatus.ACCOUNT_CHANGE) {
        return;
      }

      if (
        data.status === EvmTransactionsQueryStatus.QUERYING_TRANSACTIONS_STARTED
      ) {
        status[key] = {
          ...data,
          status: EvmTransactionsQueryStatus.QUERYING_TRANSACTIONS
        };
      } else {
        status[key] = data;
      }

      set(queryStatus, status);
    };

    const resetQueryStatus = (): void => {
      set(queryStatus, {});
    };

    const isStatusFinished = (item: EvmTransactionQueryData) => {
      return (
        item.status ===
        EvmTransactionsQueryStatus.QUERYING_TRANSACTIONS_FINISHED
      );
    };

    const isAllFinished: ComputedRef<boolean> = computed(() => {
      const queryStatusVal = get(queryStatus);
      const addresses = Object.keys(queryStatusVal);

      return addresses.every((address: string) => {
        return isStatusFinished(queryStatusVal[address]);
      });
    });

    const queryingLength = computed<number>(
      () =>
        Object.values(get(queryStatus)).filter(item => !isStatusFinished(item))
          .length
    );

    const length = computed<number>(() => Object.keys(get(queryStatus)).length);

    return {
      queryStatus,
      isAllFinished,
      queryingLength,
      length,
      isStatusFinished,
      setQueryStatus,
      resetQueryStatus
    };
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useTxQueryStatusStore, import.meta.hot)
  );
}

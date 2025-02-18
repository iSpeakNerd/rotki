import { useAssetIgnoreApi } from '@/services/assets/ignore';
import { useIgnoredAssetsStore } from '@/store/assets/ignored';

vi.mock('@/services/assets/ignore', () => ({
  useAssetIgnoreApi: vi.fn().mockReturnValue({
    getIgnoredAssets: vi.fn().mockResolvedValue([]),
    addIgnoredAssets: vi.fn().mockResolvedValue([]),
    removeIgnoredAssets: vi.fn().mockResolvedValue([])
  })
}));

describe('store::assets/ignored', () => {
  setActivePinia(createPinia());
  const store: ReturnType<typeof useIgnoredAssetsStore> =
    useIgnoredAssetsStore();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the ignored assets', async () => {
    const mockIgnoredAssets = ['ETH'];
    const { ignoredAssets } = storeToRefs(store);

    expect(get(ignoredAssets)).toEqual([]);
    vi.mocked(useAssetIgnoreApi().getIgnoredAssets).mockResolvedValue(
      mockIgnoredAssets
    );
    await store.fetchIgnoredAssets();
    expect(useAssetIgnoreApi().getIgnoredAssets).toHaveBeenCalledOnce();
    expect(get(ignoredAssets)).toEqual(mockIgnoredAssets);
  });

  it('should add ignored asset', async () => {
    vi.mocked(useAssetIgnoreApi().addIgnoredAssets).mockResolvedValue([
      'ETH',
      'DAI'
    ]);
    await store.ignoreAsset('DAI');
    expect(useAssetIgnoreApi().addIgnoredAssets).toHaveBeenCalledWith(['DAI']);
  });

  it('should remove ignored asset', async () => {
    vi.mocked(useAssetIgnoreApi().addIgnoredAssets).mockResolvedValue(['ETH']);
    await store.ignoreAsset('DAI');
    expect(useAssetIgnoreApi().addIgnoredAssets).toHaveBeenCalledWith(['DAI']);
  });

  it('isAssetIgnored return correct result', () => {
    const { isAssetIgnored } = store;

    expect(get(isAssetIgnored('ETH'))).toEqual(true);
    expect(get(isAssetIgnored('BCH'))).toEqual(false);
  });
});

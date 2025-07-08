import Image from 'next/image';

export function PoweredBy() {
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/redapplex-ai-platform.firebasestorage.app/o/WooriVenture_L.png?alt=media&token=a40ba88f-4d35-4f6e-88eb-b2245da06cc3"
        alt="WOORI Ventures Logo"
        width={120}
        height={120}
      />
      <p className="mt-2 text-sm text-muted-foreground">Powered by Woori Ventures</p>
    </div>
  );
}

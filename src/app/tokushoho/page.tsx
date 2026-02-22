import { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | ポケット制作進行",
  description: "特定商取引法に基づく表記",
};

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto">
      <article className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-xl font-bold mb-1">特定商取引法に基づく表記</h1>
        <p className="text-sm text-muted-foreground mb-6">
          最終更新日: 2026年2月22日
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <Row label="事業者名">合同会社TOONIQ</Row>
              <Row label="代表者名">大木天翔</Row>
              <Row label="所在地">
                東京都渋谷区広尾1丁目2番地1号 ヒカリビル4階
              </Row>
              <Row label="電話番号">
                090-9641-1966
                <p className="text-xs text-muted-foreground mt-1">
                  ※ お問い合わせはメールにてお願いいたします
                </p>
              </Row>
              <Row label="メールアドレス">contact@tooniq.co.jp</Row>
              <Row label="URL">https://pocket-seishin.vercel.app</Row>
              <Row label="販売価格">
                任意の金額（都度決済・税込表示）
              </Row>
              <Row label="販売価格以外の必要料金">
                なし
                <p className="text-xs text-muted-foreground mt-1">
                  ※ インターネット接続料金はお客様のご負担となります
                </p>
              </Row>
              <Row label="支払方法">
                クレジットカード、PayPay（Stripe経由）
                <p className="text-xs text-muted-foreground mt-1">
                  VISA, Mastercard, American Express, JCB
                </p>
              </Row>
              <Row label="支払時期">決済画面での操作時に即時決済</Row>
              <Row label="サービス提供時期">
                本サービスは開発支援（寄付）のため、対価としてのサービス提供はありません
              </Row>
              <Row label="返品・キャンセル">
                寄付の性質上、決済完了後の返金は原則として行っておりません
              </Row>
              <Row label="動作環境">
                <p>以下のブラウザの最新版に対応しています：</p>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                  <li>Google Chrome</li>
                  <li>Safari</li>
                  <li>Microsoft Edge</li>
                </ul>
              </Row>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-muted-foreground text-xs">以上</p>
      </article>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-border">
      <th className="text-left py-3 pr-4 w-40 align-top font-semibold bg-muted/50">
        {label}
      </th>
      <td className="py-3">{children}</td>
    </tr>
  );
}

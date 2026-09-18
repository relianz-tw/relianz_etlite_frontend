'use client';

import { useInitialization } from '../../state/InitializationContext';
import { btnPrimaryDisableable } from '../../styles';
import { agreeInitializationTerms } from '@/api/initialization';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Checkbox from '@/components/ui/Checkbox';
import { useState } from 'react';

export function Step1Terms() {
  const { state, dispatch } = useInitialization();
  const [checked, setChecked] = useState(state.termsAgreed);

  const handleAgree = () => {
    if (!checked) return;
    // TODO: /ael/initialization/* 後端上線後，改回 await agreeInitializationTerms 並在失敗時擋住不前進
    // （避免重蹈 cashflow /startUp/terms 失敗仍照樣前進的問題）；目前後端未提供，先不擋流程
    agreeInitializationTerms(state.userUuid).catch(() => {});
    dispatch({ type: 'AGREE_TERMS' });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <div className='flex flex-col flex-1 min-h-0 p-5 md:p-12'>
      <h1 className='text-xl md:text-2xl font-bold text-neutral-dark mb-4 font-notoSerif'>Easytax Lite 服務合約</h1>

      <div className='flex-1 min-h-0 overflow-y-auto rounded-lg border border-neutral-blue-gray/30 bg-surface-off-white p-4 text-sm leading-relaxed text-neutral-mid'>
        {/* 條款全文比照姊妹專案 relianz_cashflow_frontend 的 src/app/startUp/terms/page.tsx（同一經營主體：友信創新股份有限公司），
            僅將版面改為本頁滾動區樣式，文字內容未刪改；標題沿用來源文件原文「EASYTAX」用語 */}
        <p className='mb-3'>
          非常歡迎台端光臨「EASYTAX 線上記帳平台」（下稱本網站），本網站由友信創新股份有限公司（下稱「本公司」）經營，為了讓台端能夠安心的使用本網站的各項服務與資訊，特此向台端說明本網站的隱私權政策及平台條款（下稱本條款），以保障台端的權益，請台端使用本網站服務前，詳閱並確認同意下列全部內容：
        </p>

        <p className='mb-2 font-semibold text-neutral-dark'>一、EASYTAX 之服務</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>憑證上傳</li>
          <li>產出現金流報表等其他報表</li>
          <li>開立電子發票</li>
          <li>媒合會計師/記帳士事務所進行專人稅務申報</li>
        </ul>
        <p className='mb-3'>
          台端應對自己所提供至 EasyTax 平台上的所有資料負責，本公司並無閱覽台端所提供資料之權限。如本公司因提供台端服務而受有任何損害或處罰時，台端應補償之；但其係因本公司之故意或重大過失所致者，不在此限。本公司對台端之責任(包括但不限於因契約、侵權行為或其他法律或衡平理論所生者)，以台端就服務事項已給付之全部服務費用為上限。台端同意就因服務事項所生之責任，將僅向本公司求償或進行相關程序，不得對本公司之股東、董監事、經理人、顧問、員工或其他相關人員求償或進行相關程序。
        </p>
        <p className='mb-3'>
          任一方均得不附理由隨時於 7 日前以書面通知他方終止本契約。本契約終止時，除因本公司之故意或重大過失致服務事項無法完成之情形外，本公司無退還已收款項（如有）之義務。
        </p>
        <p className='mb-2 font-semibold text-neutral-dark'>退款政策</p>
        <p className='mb-3'>
          本公司所提供之服務屬於『非以有形媒介提供之數位內容』及『一經提供即為完成之線上服務』，並無提供 7 日鑑賞期。但考量到一般創業著難免遇到不可抗力而不得繼續正常申辦，本公司有條件提供全部及部分退費機制：
        </p>
        <p className='mb-3'>
          <strong className='text-neutral-dark'>EasyTax 線上記帳：</strong>
          本服務屬於全線上訂閱式服務，月租用戶得隨時向本公司提出終止服務請求。年租用戶若欲提前終止服務得支付違約金後終止服務。用戶若提出終止合約，自當期合約終止後，本公司無帳務及稅務銜接之義務，用戶須自行負責準時申報或其他相關義務。
          <br />
          <br />
          年租用戶享有優惠折扣，若提前解約則同意放棄優惠折扣待遇，並使用等同服務正常月租金做為計算。違約金計算：(已使用合約期數 x 無優惠月租費用) – (已使用合約期數 x 優惠月租費用) + ((合約剩餘期數 x 無優惠月租費用) x 50%)
        </p>
        <p className='mb-3'>
          <strong className='text-neutral-dark'>電子發票服務：</strong>
          本服務屬於全線上訂閱式服務，月租用戶得隨時向本公司提出終止服務請求。惟本公司一但受理，設定費及代辦費則無法退費。
        </p>

        <p className='mb-2 font-semibold text-neutral-dark'>二、稅務申報委任</p>
        <p className='mb-2'>本公司並無提供稅務申報服務，台端同意由本公司複委任會計師/記帳士事務所（下稱事務所）提供專業稅務申報。委任範圍包含：</p>
        <p className='mb-2'>辦理各類稅捐稽徵之申報及申請。</p>
        <ul className='mb-3 list-disc list-outside pl-6'>
          <li>各期營業稅申報</li>
          <li>年度各類所得扣繳申報</li>
          <li>年度營利事業所得稅結算申報（書審申報）及公司未分配盈餘申報</li>
          <li>年度公司營所稅暫繳申報</li>
          <li>經濟部負責人及主要股東資訊平台申報（年度）</li>
        </ul>
        <p className='mb-3'>事務所應依法令規定辦理上開委任範圍內之事務，超出上開委任範圍之其他委任事項酬金另訂。</p>
        <p className='mb-2'>
          <strong className='text-neutral-dark'>複委任期間</strong>：自服務開通日起
        </p>
        <p className='mb-3'>終止複委任：提出終止 EasyTax 服務後，下一次扣款日期前</p>
        <p className='mb-2'>公司/行號義務</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>公司/行號應於申報或申請期限至少 7 日前上傳完整申報或申辦資料至 EasyTax 平台，並全權委託事務所辦理申報（辦）。公司／行號應自行妥善保管已上傳憑證及相關交易資料至少五年。</li>
          <li>事務所應將申報（辦）結果告知公司/行號，公司/行號對申報（辦）內容應予核對。</li>
          <li>若發現不符，應於 2 日內告知事務所辦理更正；逾期未告知，視同承認申報（辦）事項。</li>
          <li>若有應繳稅款，公司/行號應自行如期繳納。公司/行號如因違反法令或未能如期繳納所受之處罰，應由公司/行號自負責任。</li>
          <li>公司/行號對所提供的資料內容自負審查責任。稅務申報內容是依公司/行號意見及相關法規辦理。如公司/行號所提供之資料有不實、不當，或故意不提交必要資料或因隱瞞欺騙而致使事務所遭受有任何損害時，一切法律責任由公司/行號負責之。</li>
        </ul>
        <p className='mb-2'>若有下列情況，事務所將會終止委任並停止服務。</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>公司/行號如未能於事務所指定之期限提交相關憑證</li>
          <li>延遲給付酬金達１期</li>
          <li>所提交之帳證文據虛偽不實</li>
          <li>事務所若無法與公司/行號取得聯絡，致無法繼續辦理委任範圍事項。</li>
          <li>公司/行號未如期繳納各項稅款。</li>
        </ul>
        <p className='mb-3'>
          經事務所告知終止委任後，公司/行號應在當期 EasyTax 服務結束後 30 日內，將所有資料下載完畢，並告知本公司終止服務。如有應付未付酬金及代墊費用，公司/行號仍應支付。
        </p>

        <p className='mb-2 font-semibold text-neutral-dark'>三、資料之保護</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>本網站主機均設有防火牆、防毒系統等相關的各項資訊安全設備及必要的安全防護措施，加以保護網站及台端的個人資料採用嚴格的保護措施，只由經過授權的人員才能接觸台端的個人資料，相關處理人員皆簽署保密合約，如有違反保密義者，將會受到相關的法律處分。</li>
          <li>如有業務委託本網站相關單位提供相關資料時，我們會要求其遵守保密義務，並採取相當之檢查程序以確定其將確實遵守。</li>
          <li>台端如發現帳號密碼不慎遺失或遭冒用，請立即通知本公司，本公司將協助辦理後續相關事宜。</li>
        </ul>

        <p className='mb-2 font-semibold text-neutral-dark'>四、電子文件及電子簽章之效力</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>本公司及台端雙方同意，以電子文件作為表示方式，依本條款傳送或交換之任何電子文件，其效力與書面文件相同。但法令另有排除適用者，不在此限。</li>
          <li>依本條款傳送或交換之任何電子文件，本公司及台端雙方同意使用電子簽章，並以電子簽章簽署，其效力與簽章之原本相同。（電子簽章係指依附於電子文件並與其相關連，用以辨識及確認電子文件簽署人身分、資格及電子文件真偽者。）</li>
          <li>本公司及台端雙方同意，以本公司選定第三方電子簽章工具（經主管機關或法令認定採用演算法與資通安全技術而具電子簽章效力者）進行電子簽章之簽署。</li>
        </ul>

        <p className='mb-2 font-semibold text-neutral-dark'>五、本條款之修訂</p>
        <p className='mb-3'>
          台端於使用本網站前，應仔細閱讀本條款，當台端瀏覽或使用本網站之全部或部分內容時，即構成全部且完整的接受本條款，包括但不限於本條款第二條至第四條之告知內容及資訊蒐集、處理及利用之約定、本條款第七條之電子文件及電子簽章效力之約定。台端並承諾於使用本網站時，皆須遵守本條款。若不同意本條款，台端應立即停止使用本網站。
        </p>

        <p className='mb-2 font-semibold text-neutral-dark'>六、責任限制</p>
        <ul className='mb-3 list-decimal list-outside pl-6'>
          <li>本公司就本網站服務不負任何明示或默示之擔保責任，且不保證網站服務之速度、安全性、可靠性、完整性、正確性及不中斷，亦不保證本網站資訊內容之正確、完整及適當得宜。</li>
          <li>本公司不保證郵件、檔案或資料之傳送及儲存均係可靠且正確無誤，亦不保證所儲存或所傳送之郵件、檔案或資料之安全性、可靠性、完整性、正確性及不中斷等，如因郵件、檔案或資料傳送或儲存失敗、遺失或錯誤等所致之任何損害，本公司不負損害賠償責任。</li>
        </ul>

        <p className='mb-2 font-semibold text-neutral-dark'>七、準據法及管轄法院</p>
        <ul className='list-decimal list-outside pl-6'>
          <li>本條款之準據法為中華民國之法令。本條款之效力、解釋、履行及其他相關法律爭議，均依據中華民國法令。</li>
          <li>任何因本條款所生或與本條款有關之爭議，本公司及台端雙方均同意應由臺灣臺北地方法院為第一審專屬管轄法院，就該爭議進行審理。</li>
        </ul>
      </div>

      <label className='mt-4 flex items-center gap-2 cursor-pointer'>
        <Checkbox checked={checked} onChange={() => setChecked(v => !v)} aria-label='我已閱讀並同意服務合約' />
        <span className='text-sm text-neutral-dark'>我已閱讀並同意上述服務合約</span>
      </label>

      <MobileFixedBottom>
        <button onClick={handleAgree} disabled={!checked} className={btnPrimaryDisableable}>
          同意並繼續
        </button>
      </MobileFixedBottom>
    </div>
  );
}

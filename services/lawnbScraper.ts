/**
 * Lawnb.com 스크래퍼 서비스
 * Puppeteer를 사용한 브라우저 자동화 방식
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface LawyerRawData {
  sid: string;
  name: string;
  nameChina: string | null;
  birthYear: number | null;
  gender: string | null;
  examType: string | null;
  examNumber: number | null;
  firmName: string;
  position: string | null;
  profileUrl: string;
}

export interface ScrapingProgress {
  currentPage: number;
  totalPages: number;
  lawyersScraped: number;
}

export class LawnbScraper {
  private baseUrl = 'https://www.lawnb.com';
  private browser: Browser | null = null;

  /**
   * 브라우저 초기화
   */
  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  /**
   * 브라우저 종료
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 특정 로펌의 모든 변호사 스크래핑
   */
  async scrapeFirm(
    firmName: string,
    onProgress?: (progress: ScrapingProgress) => void,
    maxPages?: number  // 테스트용 페이지 제한 (undefined = 모든 페이지)
  ): Promise<LawyerRawData[]> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();

    try {
      // 1. 검색 페이지로 이동
      await page.goto(`${this.baseUrl}/Info/ContentMain/Lawyer`, {
        waitUntil: 'networkidle2'
      });

      // 2. 검색 폼이 로드될 때까지 대기
      await page.waitForSelector('#sWork', { timeout: 10000 });

      // 3. 검색어 입력
      await page.type('#sWork', firmName);

      // 4. 검색 버튼 클릭 (JavaScript 이벤트 핸들러 작동)
      const searchButtonClicked = await page.evaluate(() => {
        // "검색" 텍스트가 있는 버튼 찾기
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        const searchButton = buttons.find(btn =>
          btn.textContent?.includes('검색') ||
          (btn as HTMLInputElement).value?.includes('검색')
        );

        if (searchButton) {
          (searchButton as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!searchButtonClicked) {
        throw new Error('검색 버튼을 찾을 수 없습니다');
      }

      // 페이지 네비게이션 대기
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      console.log('📍 Current URL after submit:', page.url());

      // AJAX 결과 로딩 대기 (3초)
      console.log('⏳ Waiting for AJAX results to load...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 디버깅: 스크린샷과 HTML 저장
      if (process.env.DEBUG_HTML) {
        await page.screenshot({ path: '/tmp/lawnb_result_page.png', fullPage: true });
        console.log('📸 Screenshot saved to /tmp/lawnb_result_page.png');
      }

      // 4. 총 페이지 수 확인
      const totalPages = await this.getTotalPages(page);
      const pagesToScrape = maxPages ? Math.min(totalPages, maxPages) : totalPages;
      const allLawyers: LawyerRawData[] = [];

      // 5. 모든 페이지 스크래핑
      for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
        try {
          if (pageNum > 1) {
            // 다음 페이지로 이동
            await this.goToPage(page, pageNum);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
          }

          // 현재 페이지 파싱
          const lawyers = await this.parsePage(page);
          allLawyers.push(...lawyers);

          // 진행 상황 콜백
          if (onProgress) {
            onProgress({
              currentPage: pageNum,
              totalPages,
              lawyersScraped: allLawyers.length
            });
          }

          console.log(`[${firmName}] Page ${pageNum}/${totalPages} - ${lawyers.length} lawyers`);
        } catch (error) {
          console.error(`❌ Error on page ${pageNum}:`, error instanceof Error ? error.message : error);
          console.log(`⚠️  Stopping at page ${pageNum - 1}. Returning ${allLawyers.length} lawyers collected so far.`);
          break; // 이미 수집한 데이터 반환
        }
      }

      return allLawyers;

    } finally {
      await page.close();
    }
  }

  /**
   * 로펌의 총 변호사 수만 빠르게 확인 (첫 페이지만)
   * 전체 스크래핑 없이 headcount 변동 감지용
   */
  async checkHeadcount(firmName: string): Promise<number> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();

    try {
      // 1. 검색 페이지로 이동
      await page.goto(`${this.baseUrl}/Info/ContentMain/Lawyer`, {
        waitUntil: 'networkidle2'
      });

      // 2. 검색 폼 로드 대기
      await page.waitForSelector('#sWork', { timeout: 10000 });

      // 3. 검색어 입력
      await page.type('#sWork', firmName);

      // 4. 검색 버튼 클릭
      const searchButtonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        const searchButton = buttons.find(btn =>
          btn.textContent?.includes('검색') ||
          (btn as HTMLInputElement).value?.includes('검색')
        );

        if (searchButton) {
          (searchButton as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!searchButtonClicked) {
        throw new Error('검색 버튼을 찾을 수 없습니다');
      }

      // 5. 페이지 네비게이션 대기
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      // 6. AJAX 결과 로딩 대기
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 7. "검색결과 1245 건" 텍스트에서 총 인원수 추출
      const totalCount = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const resultDiv = allDivs.find(div =>
          div.textContent?.includes('검색결과') && div.textContent?.includes('건')
        );
        const text = resultDiv?.textContent?.trim() || '';

        // "검색결과 1245 건" 형식에서 1245 추출
        const match = text.match(/검색결과\s+(\d+)\s+건/);
        return match ? parseInt(match[1]) : 0;
      });

      console.log(`📊 [${firmName}] Total headcount: ${totalCount}`);
      return totalCount;

    } finally {
      await page.close();
    }
  }

  /**
   * 총 페이지 수 추출
   */
  private async getTotalPages(page: Page): Promise<number> {
    try {
      // "검색결과" 텍스트를 포함한 div 찾기
      const resultText = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const resultDiv = allDivs.find(div =>
          div.textContent?.includes('검색결과') && div.textContent?.includes('건')
        );
        return resultDiv?.textContent?.trim() || '';
      });

      console.log('📄 Result text:', resultText.substring(0, 100));

      // "검색결과 1245 건 1/63" 형식에서 63 추출
      const match = resultText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        console.log(`📊 Total pages found: ${match[2]}`);
        return parseInt(match[2]);
      } else {
        console.log('⚠️  No page number match found in result text');
      }
    } catch (error) {
      console.error('❌ 페이지 정보 오류:', error);
    }

    return 1;
  }

  /**
   * 특정 페이지로 이동
   */
  private async goToPage(page: Page, pageNum: number): Promise<void> {
    // 현재 페이지 번호 확인
    const getCurrentPage = async (): Promise<number> => {
      return await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const resultDiv = allDivs.find(div =>
          div.textContent?.includes('검색결과') && div.textContent?.includes('건')
        );
        const text = resultDiv?.textContent || '';
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        return match ? parseInt(match[1]) : 1;
      });
    };

    let currentPage = await getCurrentPage();

    // 목표 페이지에 도달할 때까지 반복
    while (currentPage < pageNum) {
      // 1. 먼저 직접 페이지 링크가 있는지 확인
      const directLinkFound = await page.evaluate((targetPage) => {
        // navigationLinks 내의 페이지 링크 찾기
        const pageLinks = Array.from(document.querySelectorAll('.navigationLinks a.navPages, .navigationLinks a'));
        const targetLink = pageLinks.find(link =>
          link.textContent?.trim() === String(targetPage)
        );

        if (targetLink) {
          (targetLink as HTMLAnchorElement).click();
          return true;
        }
        return false;
      }, pageNum);

      if (directLinkFound) {
        // 직접 링크를 찾아서 클릭한 경우
        await page.waitForFunction(
          (expectedPage) => {
            const allDivs = Array.from(document.querySelectorAll('div'));
            const resultDiv = allDivs.find(div =>
              div.textContent?.includes('검색결과') && div.textContent?.includes('건')
            );
            const text = resultDiv?.textContent || '';
            const match = text.match(/(\d+)\s*\/\s*(\d+)/);
            return match && match[1] === String(expectedPage);
          },
          { timeout: 10000 },
          pageNum
        );
        break;
      } else {
        // 2. 직접 링크가 없으면 navNext 버튼 클릭
        const nextClicked = await page.evaluate(() => {
          const nextButton = document.querySelector('.navigationLinks a.navNext');
          if (nextButton) {
            (nextButton as HTMLAnchorElement).click();
            return true;
          }
          return false;
        });

        if (!nextClicked) {
          throw new Error(`페이지 ${pageNum}로 이동할 수 없습니다 (navNext 버튼 없음)`);
        }

        // 페이지가 변경될 때까지 대기
        const previousPage = currentPage;
        await page.waitForFunction(
          (prevPage) => {
            const allDivs = Array.from(document.querySelectorAll('div'));
            const resultDiv = allDivs.find(div =>
              div.textContent?.includes('검색결과') && div.textContent?.includes('건')
            );
            const text = resultDiv?.textContent || '';
            const match = text.match(/(\d+)\s*\/\s*(\d+)/);
            return match && parseInt(match[1]) > prevPage;
          },
          { timeout: 10000 },
          previousPage
        );

        // 현재 페이지 업데이트
        currentPage = await getCurrentPage();
      }

      // AJAX 결과 로딩 완료 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * 현재 페이지의 변호사 목록 파싱
   */
  private async parsePage(page: Page): Promise<LawyerRawData[]> {
    const html = await page.content();
    const $ = cheerio.load(html);

    // 디버깅: HTML 저장
    if (process.env.DEBUG_HTML) {
      const fs = require('fs');
      fs.writeFileSync('/tmp/lawnb_debug.html', html);
      console.log('📝 Debug HTML saved to /tmp/lawnb_debug.html');
    }

    const lawyers: LawyerRawData[] = [];

    // 변호사 목록: ol.list.lawyer > li
    const resultItems = $('ol.list.lawyer > li, ol.list > li').filter((_, el) => {
      return $(el).find('a[href*="ContentView"]').length > 0;
    });
    console.log(`🔍 Found ${resultItems.length} lawyer items`);

    resultItems.each((_, element) => {
      const $el = $(element);

      // 이름 및 한자명: "강검윤(姜鈐允)"
      const nameText = $el.find('h3 a').text().trim();
      const nameMatch = nameText.match(/^(.+?)\((.+?)\)$/);

      // 프로필 URL 및 SID
      const profileUrl = $el.find('h3 a').attr('href') || '';
      const sidMatch = profileUrl.match(/sid=([A-Z0-9]+)/);

      // 출생정보: "1991년생 / 남자 / 변호사시험 8"
      // h3 다음에 오는 div > span에서 찾기
      const birthInfo = $el.find('div > span').first().text().trim();
      const birthMatch = birthInfo.match(/(\d{4})년생?\s*\/\s*(남자|여자)\s*\/\s*(.+)/);

      // 현직정보: "현직 : 변호사 / 법무법인(유) 로고스"
      const currentInfo = $el.find('.co_searchResults_summary').text().trim();
      const currentMatch = currentInfo.match(/현직\s*:\s*(.+?)\s*\/\s*(.+)/);

      // 시험 정보 파싱
      let examType: string | null = null;
      let examNumber: number | null = null;

      if (birthMatch && birthMatch[3]) {
        const examInfo = birthMatch[3].trim();
        const examMatch = examInfo.match(/(.+?)\s+(\d+)/);
        if (examMatch) {
          examType = examMatch[1];
          examNumber = parseInt(examMatch[2]);
        } else {
          examType = examInfo;
        }
      }

      if (sidMatch && nameText && currentMatch) {
        lawyers.push({
          sid: sidMatch[1],
          name: nameMatch ? nameMatch[1] : nameText,
          nameChina: nameMatch ? nameMatch[2] : null,
          birthYear: birthMatch ? parseInt(birthMatch[1]) : null,
          gender: birthMatch ? birthMatch[2] : null,
          examType,
          examNumber,
          firmName: currentMatch[2],
          position: currentMatch[1],
          profileUrl
        });
      }
    });

    return lawyers;
  }

  /**
   * 여러 로펌을 순차적으로 스크래핑
   */
  async scrapeMultipleFirms(
    firmNames: string[],
    onProgress?: (firmName: string, progress: ScrapingProgress) => void
  ): Promise<Record<string, LawyerRawData[]>> {
    const results: Record<string, LawyerRawData[]> = {};

    for (const firmName of firmNames) {
      console.log(`\n🏢 Scraping: ${firmName}`);

      results[firmName] = await this.scrapeFirm(firmName, (progress) => {
        if (onProgress) {
          onProgress(firmName, progress);
        }
      });

      console.log(`✅ ${firmName}: ${results[firmName].length} lawyers`);

      // Rate limiting between firms
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}

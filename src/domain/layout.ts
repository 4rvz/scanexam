import type { AnswerOption, WorksheetTemplate } from './template';

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const ITEMS_PER_PAGE = 50;

const OPTIONS: readonly AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];
const MARKER_INSET = 10;
const MARKER_SIZE = 8;
const QUESTIONS_PER_COLUMN = ITEMS_PER_PAGE / 2;
const QUESTION_TOP = 52;
const QUESTION_ROW_GAP = 8.4;
const LEFT_COLUMN_X = 18;
const RIGHT_COLUMN_X = 112;
const BUBBLE_START_X = 34;
const BUBBLE_GAP = 9;
const BUBBLE_RADIUS = 3;

export interface Point {
  x: number;
  y: number;
}

export interface CornerMarker extends Point {
  size: number;
}

export interface BubbleLayout extends Point {
  radius: number;
}

export interface QuestionLayout {
  number: number;
  numberPosition: Point;
  bubbles: Partial<Record<AnswerOption, BubbleLayout>>;
}

export interface QrPayload {
  templateId: string;
  layoutVersion: number;
  pageIndex: number;
}

export interface QrCodeLayout extends Point {
  size: number;
  payload: QrPayload;
}

export interface PageLayout {
  pageIndex: number;
  markers: CornerMarker[];
  questions: QuestionLayout[];
  qrCode: QrCodeLayout;
}

export function getPageLayout(template: WorksheetTemplate, pageIndex: number): PageLayout {
  const firstQuestion = pageIndex * ITEMS_PER_PAGE + 1;
  const questionNumbers = Array.from(
    { length: Math.max(0, Math.min(ITEMS_PER_PAGE, template.itemCount - firstQuestion + 1)) },
    (_, index) => firstQuestion + index,
  );

  return buildPageLayout(template, pageIndex, questionNumbers);
}

export function getAllPageLayouts(template: WorksheetTemplate): PageLayout[] {
  return Array.from(
    { length: Math.ceil(template.itemCount / ITEMS_PER_PAGE) },
    (_, pageIndex) => getPageLayout(template, pageIndex),
  );
}

function buildPageLayout(
  template: WorksheetTemplate,
  pageIndex: number,
  questionNumbers: number[],
): PageLayout {
  const markers = [
    { x: MARKER_INSET, y: MARKER_INSET },
    { x: PAGE_WIDTH - MARKER_INSET - MARKER_SIZE, y: MARKER_INSET },
    { x: MARKER_INSET, y: PAGE_HEIGHT - MARKER_INSET - MARKER_SIZE },
    { x: PAGE_WIDTH - MARKER_INSET - MARKER_SIZE, y: PAGE_HEIGHT - MARKER_INSET - MARKER_SIZE },
  ].map((marker) => ({ ...marker, size: MARKER_SIZE }));

  return {
    pageIndex,
    markers,
    questions: questionNumbers.map((number, index) => buildQuestionLayout(number, index, template.optionCount)),
    qrCode: {
      x: PAGE_WIDTH - 36,
      y: 20,
      size: 20,
      payload: {
        templateId: template.id,
        layoutVersion: template.layoutVersion,
        pageIndex,
      },
    },
  };
}

function buildQuestionLayout(number: number, index: number, optionCount: number): QuestionLayout {
  const column = Math.floor(index / QUESTIONS_PER_COLUMN);
  const row = index % QUESTIONS_PER_COLUMN;
  const columnX = column === 0 ? LEFT_COLUMN_X : RIGHT_COLUMN_X;
  const y = QUESTION_TOP + row * QUESTION_ROW_GAP;
  const bubbles = Object.fromEntries(
    OPTIONS.slice(0, optionCount).map((option, optionIndex) => [option, {
      x: columnX + BUBBLE_START_X + optionIndex * BUBBLE_GAP,
      y,
      radius: BUBBLE_RADIUS,
    }]),
  ) as Partial<Record<AnswerOption, BubbleLayout>>;

  return {
    number,
    numberPosition: { x: columnX, y },
    bubbles,
  };
}
